-- =========================================================
-- Tableplanner v2.0  Minimal DDL (PostgreSQL)
-- Entities: events, canvases, objects, guests, guest_assignments,
--           exhibitors, exhibitor_assignments
-- =========================================================

-- 1) enum for event type
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'event_type') THEN
    CREATE TYPE event_type AS ENUM ('conference','trade_show');
  END IF;
END$$;

-- 2) events (top-level container; decides conference/trade_show)
DROP TABLE IF EXISTS events CASCADE;
CREATE TABLE events (
  id           BIGSERIAL PRIMARY KEY,
  name         TEXT NOT NULL,
  type         event_type NOT NULL,         -- conference | trade_show
  description  TEXT,
  venue        TEXT,
  start_time   TIMESTAMPTZ,
  end_time     TIMESTAMPTZ,
  is_public    BOOLEAN DEFAULT FALSE,
  share_token  TEXT UNIQUE,                 -- for public/share URL
  metadata     JSONB DEFAULT '{}'::jsonb,   -- presets / extra config
  created_at   TIMESTAMPTZ DEFAULT now(),
  updated_at   TIMESTAMPTZ DEFAULT now()
);

-- 3) canvases (each event can have multiple canvases/floors/versions)
DROP TABLE IF EXISTS canvases CASCADE;
CREATE TABLE canvases (
  id           BIGSERIAL PRIMARY KEY,
  event_id     BIGINT NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  name         TEXT NOT NULL,
  width        INTEGER NOT NULL,            -- logical width for React-Konva
  height       INTEGER NOT NULL,            -- logical height
  scale_ratio  NUMERIC(10,4) DEFAULT 1.0,   -- optional: stage scale
  offset_x     NUMERIC(12,4),               -- optional: stage translate X
  offset_y     NUMERIC(12,4),               -- optional: stage translate Y
  version      INTEGER DEFAULT 1,
  is_active    BOOLEAN DEFAULT TRUE,
  created_at   TIMESTAMPTZ DEFAULT now(),
  updated_at   TIMESTAMPTZ DEFAULT now()
);

-- 4) objects (everything on canvas: booth/chair/table/stage/aisle...)
DROP TABLE IF EXISTS objects CASCADE;
CREATE TABLE objects (
  id           BIGSERIAL PRIMARY KEY,
  canvas_id    BIGINT NOT NULL REFERENCES canvases(id) ON DELETE CASCADE,
  obj_type     TEXT NOT NULL,               -- e.g. 'booth','chair','table',...
  label        TEXT,                        -- e.g. 'B12' / 'T1-S03'
  number       INTEGER,                     -- optional numeric identifier
  position_x   NUMERIC(12,4) NOT NULL,
  position_y   NUMERIC(12,4) NOT NULL,
  width        NUMERIC(12,4),
  height       NUMERIC(12,4),
  rotation     NUMERIC(10,4) DEFAULT 0,
  scale_x      NUMERIC(10,4) DEFAULT 1.0,   -- non-uniform scale
  scale_y      NUMERIC(10,4) DEFAULT 1.0,   -- non-uniform scale
  seats        INTEGER DEFAULT 0,           -- capacity for table/booth
  z_index      INTEGER DEFAULT 0,
  meta_json    JSONB DEFAULT '{}'::jsonb,   -- per-type details
  is_active    BOOLEAN DEFAULT TRUE,
  created_at   TIMESTAMPTZ DEFAULT now()
);

-- 5) guests (conference attendees)
DROP TABLE IF EXISTS guests CASCADE;
CREATE TABLE guests (
  id           BIGSERIAL PRIMARY KEY,
  event_id     BIGINT NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  name         TEXT NOT NULL,
  email        TEXT,
  phone        TEXT,
  company      TEXT,
  title        TEXT,
  dietary      JSONB,                       -- e.g. {"vegetarian":true,...}
  access       JSONB,                       -- e.g. {"wheelchair":true,...}
  created_at   TIMESTAMPTZ DEFAULT now()
);

-- 6) guest_assignments (seat allocation for guests -> objects)
DROP TABLE IF EXISTS guest_assignments CASCADE;
CREATE TABLE guest_assignments (
  id              BIGSERIAL PRIMARY KEY,
  event_id        BIGINT NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  guest_id        BIGINT NOT NULL REFERENCES guests(id) ON DELETE CASCADE,
  seat_object_id  BIGINT NOT NULL REFERENCES objects(id) ON DELETE CASCADE, -- should be a seat-like object
  seat_label      TEXT,
  checked_in      BOOLEAN DEFAULT FALSE,
  is_active       BOOLEAN DEFAULT TRUE,
  created_at      TIMESTAMPTZ DEFAULT now()
);

-- 7) exhibitors (trade show companies)
DROP TABLE IF EXISTS exhibitors CASCADE;
CREATE TABLE exhibitors (
  id           BIGSERIAL PRIMARY KEY,
  event_id     BIGINT NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  company      TEXT NOT NULL,
  contact_name TEXT,                       
  email        TEXT,
  phone        TEXT,
  website      TEXT,                        
  logo_url     TEXT,                        -- CDN or absolute URL
  category     TEXT,
  prefs        JSONB,                       -- e.g. {"booth_size":"3x3","power":true}
  created_at   TIMESTAMPTZ DEFAULT now()
);

-- 8) exhibitor_assignments (booth allocation for exhibitors -> objects)
DROP TABLE IF EXISTS exhibitor_assignments CASCADE;
CREATE TABLE exhibitor_assignments (
  id               BIGSERIAL PRIMARY KEY,
  event_id         BIGINT NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  exhibitor_id     BIGINT NOT NULL REFERENCES exhibitors(id) ON DELETE CASCADE,
  booth_object_id  BIGINT NOT NULL REFERENCES objects(id) ON DELETE CASCADE, -- must be obj_type='booth'
  checked_in       BOOLEAN DEFAULT FALSE,
  is_active        BOOLEAN DEFAULT TRUE,
  created_at       TIMESTAMPTZ DEFAULT now()
);

-- 9) tradeshow_routes (route definition for trade shows)
DROP TABLE IF EXISTS tradeshow_routes CASCADE;
CREATE TABLE tradeshow_routes (
  id           BIGSERIAL PRIMARY KEY,
  event_id     BIGINT NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  name         TEXT NOT NULL DEFAULT 'Default Route',
  route_type   TEXT DEFAULT 'auto',         -- 'auto' | 'manual'
  booth_order  JSONB NOT NULL,              -- e.g. [123, 456, 789] (objects.id for booths)
  created_at   TIMESTAMPTZ DEFAULT now(),
  updated_at   TIMESTAMPTZ DEFAULT now(),
  created_by   BIGINT                       -- (optional FK to users.id in future)
);

-- =========================================================
-- Tableplanner v2.0 — Uniques & Indexes (PostgreSQL)
-- 唯一约束/索引
-- =========================================================

-- ========== canvases ==========
-- 按活动加载/筛选画布（常用）
CREATE INDEX IF NOT EXISTS idx_canvases_event_active ON canvases (event_id, is_active);

-- ========== objects ==========
-- 渲染/列表常用：按画布 + 类型 + 激活状态
CREATE INDEX IF NOT EXISTS idx_objects_canvas_type_active
  ON objects (canvas_id, obj_type, is_active);

-- 分层绘制/拖拽：z 顺序
CREATE INDEX IF NOT EXISTS idx_objects_canvas_z
  ON objects (canvas_id, z_index);

-- 同一画布内，label 唯一（忽略空值）→ 可读编号不冲突
CREATE UNIQUE INDEX IF NOT EXISTS uq_objects_canvas_label
  ON objects (canvas_id, label)
  WHERE label IS NOT NULL;

-- 同一画布内，number 唯一（忽略空值）
CREATE UNIQUE INDEX IF NOT EXISTS uq_objects_canvas_number
  ON objects (canvas_id, number)
  WHERE number IS NOT NULL;

-- ========== guests ==========
-- 同一活动内，email 唯一（忽略空值；大小写不敏感）
CREATE UNIQUE INDEX IF NOT EXISTS uq_guests_event_email_ci
  ON guests (event_id, lower(email))
  WHERE email IS NOT NULL;

-- 名称检索（名单页/搜索）
CREATE INDEX IF NOT EXISTS idx_guests_event_name
  ON guests (event_id, name);

-- ========== exhibitors ==========
-- 同一活动内，company 唯一（可选；忽略空值；大小写不敏感）
CREATE UNIQUE INDEX IF NOT EXISTS uq_exhibitors_event_company_ci
  ON exhibitors (event_id, lower(company))
  WHERE company IS NOT NULL;

-- 同一活动内，email 唯一（忽略空值；大小写不敏感）
CREATE UNIQUE INDEX IF NOT EXISTS uq_exhibitors_event_email_ci
  ON exhibitors (event_id, lower(email))
  WHERE email IS NOT NULL;

-- 常用过滤
CREATE INDEX IF NOT EXISTS idx_exhibitors_event_company
  ON exhibitors (event_id, company);

-- ========== guest_assignments ==========
-- 规则1：同一活动内，一个 guest 同时只有一个“活跃”分配
CREATE UNIQUE INDEX IF NOT EXISTS uq_guest_active_assignment
  ON guest_assignments (event_id, guest_id)
  WHERE is_active;

-- 规则2：同一座位对象同一时间只被一个“活跃”分配占用
CREATE UNIQUE INDEX IF NOT EXISTS uq_seat_object_active
  ON guest_assignments (seat_object_id)
  WHERE is_active;

-- 常用检索
CREATE INDEX IF NOT EXISTS idx_guest_assignments_event_guest
  ON guest_assignments (event_id, guest_id);
CREATE INDEX IF NOT EXISTS idx_guest_assignments_object
  ON guest_assignments (seat_object_id);

-- ========== exhibitor_assignments ==========
-- 规则1：同一活动内，一个 exhibitor 同时只有一个“活跃”分配
CREATE UNIQUE INDEX IF NOT EXISTS uq_exhibitor_active_assignment
  ON exhibitor_assignments (event_id, exhibitor_id)
  WHERE is_active;

-- 规则2：同一展位对象同一时间只被一个“活跃”分配占用
CREATE UNIQUE INDEX IF NOT EXISTS uq_booth_object_active
  ON exhibitor_assignments (booth_object_id)
  WHERE is_active;

-- 常用检索
CREATE INDEX IF NOT EXISTS idx_exhibitor_assignments_event_exhibitor
  ON exhibitor_assignments (event_id, exhibitor_id);
CREATE INDEX IF NOT EXISTS idx_exhibitor_assignments_object
  ON exhibitor_assignments (booth_object_id);

-- ========== tradeshow_routes ==========
-- 按活动加载路由；时间排序方便读取最新
CREATE INDEX IF NOT EXISTS idx_routes_event_created
  ON tradeshow_routes (event_id, created_at);

-- ========== events ==========
-- 分享/公开场景：share_token 已在表定义做 UNIQUE 约束；这里补常用筛选
CREATE INDEX IF NOT EXISTS idx_events_type_public
  ON events (type, is_public);

-- ========== 可选：JSONB 查询（等确认会按键搜索时再启用） ==========
-- objects.meta_json / events.metadata 如果会按键过滤，可考虑建立 GIN 索引：
-- CREATE INDEX IF NOT EXISTS gin_objects_meta ON objects USING GIN (meta_json);
-- CREATE INDEX IF NOT EXISTS gin_events_metadata ON events USING GIN (metadata);



-- =========================================================
-- Tableplanner v2.0 — Triggers (PostgreSQL)
-- 一致性校验 + 规范化 + 更新 updated_at
-- =========================================================

-- ========== 通用辅助：获取 object 所属的 event_id ==========
-- Why? 下面多个校验都要知道“这个对象属于哪个活动（经由 canvas）”。抽成函数避免重复 SQL。
-- What? objects.id → canvases.id → canvases.event_id，若查不到则抛错。
-- Use by? tp_check_guest_assignment()、tp_check_exhibitor_assignment()
CREATE OR REPLACE FUNCTION tp_get_object_event_id(p_object_id BIGINT)
RETURNS BIGINT AS $$
DECLARE
  v_event_id BIGINT;
BEGIN
  SELECT c.event_id INTO v_event_id
  FROM objects o
  JOIN canvases c ON c.id = o.canvas_id
  WHERE o.id = p_object_id;

  IF v_event_id IS NULL THEN
    RAISE EXCEPTION 'Object % not found or canvas not linked to event.', p_object_id;
  END IF;

  RETURN v_event_id;
END;
$$ LANGUAGE plpgsql STABLE;

-- ========== 1) 会议：guest_assignments 一致性校验 ==========
-- Why? 防止把 A 活动的嘉宾分配到 B 活动的座位上（跨活动串场）。防止误把“展位”当成“座位”分配给嘉宾。
-- What? 校验三方 event_id 一致：guest_assignments.event_id、guests.event_id、objects→canvases→event_id。
--       校验目标对象类型：不允许 obj_type='booth' 出现在嘉宾座位分配里。
-- When? BEFORE INSERT; 
--       BEFORE UPDATE OF event_id, guest_id, seat_object_id
CREATE OR REPLACE FUNCTION tp_check_guest_assignment()
RETURNS TRIGGER AS $$
DECLARE
  v_obj_event_id   BIGINT;
  v_guest_event_id BIGINT;
  v_obj_type       TEXT;
BEGIN
  -- 目标对象所属活动
  v_obj_event_id := tp_get_object_event_id(NEW.seat_object_id);

  -- guest 所属活动
  SELECT g.event_id INTO v_guest_event_id
  FROM guests g WHERE g.id = NEW.guest_id;

  IF v_guest_event_id IS NULL THEN
    RAISE EXCEPTION 'Guest % not found.', NEW.guest_id;
  END IF;

  -- 三方一致：assignment.event_id = guest.event_id = object.event_id
  IF NEW.event_id <> v_guest_event_id OR NEW.event_id <> v_obj_event_id THEN
    RAISE EXCEPTION
      'Event mismatch: assignment.event_id=%, guest.event_id=%, object.event_id=%',
      NEW.event_id, v_guest_event_id, v_obj_event_id;
  END IF;

  -- 类型校验：嘉宾座位分配不能指向 booth
  SELECT o.obj_type INTO v_obj_type FROM objects o WHERE o.id = NEW.seat_object_id;
  IF v_obj_type IS NULL THEN
    RAISE EXCEPTION 'Seat object % not found.', NEW.seat_object_id;
  END IF;
  IF lower(v_obj_type) = 'booth' THEN
    RAISE EXCEPTION 'Seat assignment cannot point to a booth object (id=%).', NEW.seat_object_id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_check_guest_assignment_ins ON guest_assignments;
CREATE TRIGGER trg_check_guest_assignment_ins
BEFORE INSERT ON guest_assignments
FOR EACH ROW EXECUTE FUNCTION tp_check_guest_assignment();

DROP TRIGGER IF EXISTS trg_check_guest_assignment_upd ON guest_assignments;
CREATE TRIGGER trg_check_guest_assignment_upd
BEFORE UPDATE OF event_id, guest_id, seat_object_id ON guest_assignments
FOR EACH ROW EXECUTE FUNCTION tp_check_guest_assignment();


-- ========== 2) 展会：exhibitor_assignments 一致性校验 ==========
-- Why? 防止把 B 活动的展商分配到 A 活动的展位上（跨活动串场）。 保证展商分配对象必须是展位。
-- What? 校验三方 event_id 一致：exhibitor_assignments.event_id、exhibitors.event_id、objects→canvases→event_id。 校验目标对象类型：要求 obj_type='booth'。
-- When? BEFORE INSERT;
--       BEFORE UPDATE OF event_id, exhibitor_id, booth_object_id
CREATE OR REPLACE FUNCTION tp_check_exhibitor_assignment()
RETURNS TRIGGER AS $$
DECLARE
  v_obj_event_id  BIGINT;
  v_exh_event_id  BIGINT;
  v_obj_type      TEXT;
BEGIN
  -- 目标对象所属活动
  v_obj_event_id := tp_get_object_event_id(NEW.booth_object_id);

  -- exhibitor 所属活动
  SELECT e.event_id INTO v_exh_event_id
  FROM exhibitors e WHERE e.id = NEW.exhibitor_id;

  IF v_exh_event_id IS NULL THEN
    RAISE EXCEPTION 'Exhibitor % not found.', NEW.exhibitor_id;
  END IF;

  -- 三方一致：assignment.event_id = exhibitor.event_id = object.event_id
  IF NEW.event_id <> v_exh_event_id OR NEW.event_id <> v_obj_event_id THEN
    RAISE EXCEPTION
      'Event mismatch: assignment.event_id=%, exhibitor.event_id=%, object.event_id=%',
      NEW.event_id, v_exh_event_id, v_obj_event_id;
  END IF;

  -- 类型校验：展商分配必须指向 booth
  SELECT o.obj_type INTO v_obj_type FROM objects o WHERE o.id = NEW.booth_object_id;
  IF v_obj_type IS NULL THEN
    RAISE EXCEPTION 'Booth object % not found.', NEW.booth_object_id;
  END IF;
  IF lower(v_obj_type) <> 'booth' THEN
    RAISE EXCEPTION 'Exhibitor assignment must point to obj_type=booth (id=%).', NEW.booth_object_id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_check_exhibitor_assignment_ins ON exhibitor_assignments;
CREATE TRIGGER trg_check_exhibitor_assignment_ins
BEFORE INSERT ON exhibitor_assignments
FOR EACH ROW EXECUTE FUNCTION tp_check_exhibitor_assignment();

DROP TRIGGER IF EXISTS trg_check_exhibitor_assignment_upd ON exhibitor_assignments;
CREATE TRIGGER trg_check_exhibitor_assignment_upd
BEFORE UPDATE OF event_id, exhibitor_id, booth_object_id ON exhibitor_assignments
FOR EACH ROW EXECUTE FUNCTION tp_check_exhibitor_assignment();


-- ========== 3) Email 规范化（trim + lower）==========
-- Why? 邮箱经常大小写或带空格，容易导致“重复导入”绕过唯一索引。 统一格式便于去重/联表。
-- What? 对 guests.email 做 TRIM + lower() 标准化。
-- When? BEFORE INSERT; BEFORE UPDATE OF email
CREATE OR REPLACE FUNCTION tp_normalize_email_guests()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.email IS NOT NULL THEN
    NEW.email := lower(btrim(NEW.email));
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_normalize_email_guests_ins ON guests;
CREATE TRIGGER trg_normalize_email_guests_ins
BEFORE INSERT ON guests
FOR EACH ROW EXECUTE FUNCTION tp_normalize_email_guests();

DROP TRIGGER IF EXISTS trg_normalize_email_guests_upd ON guests;
CREATE TRIGGER trg_normalize_email_guests_upd
BEFORE UPDATE OF email ON guests
FOR EACH ROW EXECUTE FUNCTION tp_normalize_email_guests();


CREATE OR REPLACE FUNCTION tp_normalize_email_exhibitors()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.email IS NOT NULL THEN
    NEW.email := lower(btrim(NEW.email));
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_normalize_email_exhibitors_ins ON exhibitors;
CREATE TRIGGER trg_normalize_email_exhibitors_ins
BEFORE INSERT ON exhibitors
FOR EACH ROW EXECUTE FUNCTION tp_normalize_email_exhibitors();

DROP TRIGGER IF EXISTS trg_normalize_email_exhibitors_upd ON exhibitors;
CREATE TRIGGER trg_normalize_email_exhibitors_upd
BEFORE UPDATE OF email ON exhibitors
FOR EACH ROW EXECUTE FUNCTION tp_normalize_email_exhibitors();


-- ========== 4) updated_at 自动刷新 ==========
-- Why? 自动维护 updated_at，便于“最近修改”的审计、同步与缓存失效。
-- What? 在更新时将 NEW.updated_at := now()。
-- When? BEFORE UPDATE on events、canvases
CREATE OR REPLACE FUNCTION tp_touch_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at := now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- events
DROP TRIGGER IF EXISTS trg_touch_events_upd ON events;
CREATE TRIGGER trg_touch_events_upd
BEFORE UPDATE ON events
FOR EACH ROW EXECUTE FUNCTION tp_touch_updated_at();

-- canvases
DROP TRIGGER IF EXISTS trg_touch_canvases_upd ON canvases;
CREATE TRIGGER trg_touch_canvases_upd
BEFORE UPDATE ON canvases
FOR EACH ROW EXECUTE FUNCTION tp_touch_updated_at();

-- tradeshow_routes
DROP TRIGGER IF EXISTS trg_touch_routes_upd ON tradeshow_routes;
CREATE TRIGGER trg_touch_routes_upd
BEFORE UPDATE ON tradeshow_routes
FOR EACH ROW EXECUTE FUNCTION tp_touch_updated_at();



-- ========== 5) objects 尺寸合法性（保守校验）(Optional)==========  (暂时未编入)!!!!!!!!!!!!!!!!!
-- What? 防止写入 “非正数宽高” 等明显错误值，降低前端渲染异常（React-Konva 节点不可见/报错）。
-- Why? 要求：若 width/height 提供，则必须 > 0。
-- When? BEFORE INSERT; BEFORE UPDATE OF width, height

CREATE OR REPLACE FUNCTION tp_check_object_geometry()
RETURNS TRIGGER AS $$
BEGIN
  -- width/height：如提供则必须为正
  IF NEW.width IS NOT NULL AND NEW.width <= 0 THEN
    RAISE EXCEPTION 'Object width must be > 0 (canvas_id=%, label=%, number=%, width=%).',
      NEW.canvas_id, NEW.label, NEW.number, NEW.width;
  END IF;
  IF NEW.height IS NOT NULL AND NEW.height <= 0 THEN
    RAISE EXCEPTION 'Object height must be > 0 (canvas_id=%, label=%, number=%, height=%).',
      NEW.canvas_id, NEW.label, NEW.number, NEW.height;
  END IF;

  -- scale_x/scale_y：必须为正
  IF NEW.scale_x IS NOT NULL AND NEW.scale_x <= 0 THEN
    RAISE EXCEPTION 'Object scale_x must be > 0 (canvas_id=%, label=%, number=%, scale_x=%).',
      NEW.canvas_id, NEW.label, NEW.number, NEW.scale_x;
  END IF;
  IF NEW.scale_y IS NOT NULL AND NEW.scale_y <= 0 THEN
    RAISE EXCEPTION 'Object scale_y must be > 0 (canvas_id=%, label=%, number=%, scale_y=%).',
      NEW.canvas_id, NEW.label, NEW.number, NEW.scale_y;
  END IF;

  -- seats：不得为负
  IF NEW.seats IS NOT NULL AND NEW.seats < 0 THEN
    RAISE EXCEPTION 'Object seats must be >= 0 (canvas_id=%, label=%, number=%, seats=%).',
      NEW.canvas_id, NEW.label, NEW.number, NEW.seats;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_check_object_geometry_ins ON objects;
CREATE TRIGGER trg_check_object_geometry_ins
BEFORE INSERT ON objects
FOR EACH ROW EXECUTE FUNCTION tp_check_object_geometry();

DROP TRIGGER IF EXISTS trg_check_object_geometry_upd ON objects;
CREATE TRIGGER trg_check_object_geometry_upd
BEFORE UPDATE OF width, height, scale_x, scale_y, seats ON objects
FOR EACH ROW EXECUTE FUNCTION tp_check_object_geometry();









-- 开发前期暂时关闭 trigger（逐个表，安全做法）
-- 关闭（嘉宾分配的一致性校验）
ALTER TABLE guest_assignments DISABLE TRIGGER trg_check_guest_assignment_ins;
ALTER TABLE guest_assignments DISABLE TRIGGER trg_check_guest_assignment_upd;

-- 关闭（展商分配的一致性校验）
ALTER TABLE exhibitor_assignments DISABLE TRIGGER trg_check_exhibitor_assignment_ins;
ALTER TABLE exhibitor_assignments DISABLE TRIGGER trg_check_exhibitor_assignment_upd;

-- 关闭（对象几何/容量校验）※ v2.1 名称：geometry 不是 dimensions
ALTER TABLE objects DISABLE TRIGGER trg_check_object_geometry_ins;
ALTER TABLE objects DISABLE TRIGGER trg_check_object_geometry_upd;

-- 可选：临时停用 email 规范化与 updated_at 自动刷新
ALTER TABLE guests    DISABLE TRIGGER trg_normalize_email_guests_ins;
ALTER TABLE guests    DISABLE TRIGGER trg_normalize_email_guests_upd;
ALTER TABLE exhibitors DISABLE TRIGGER trg_normalize_email_exhibitors_ins;
ALTER TABLE exhibitors DISABLE TRIGGER trg_normalize_email_exhibitors_upd;
ALTER TABLE events    DISABLE TRIGGER trg_touch_events_upd;
ALTER TABLE canvases  DISABLE TRIGGER trg_touch_canvases_upd;
ALTER TABLE tradeshow_routes DISABLE TRIGGER trg_touch_routes_upd;

-- ……这里执行你的导入 / 迁移 / 批量修复 ……

-- 逐一重新启用
ALTER TABLE guest_assignments     ENABLE TRIGGER trg_check_guest_assignment_ins;
ALTER TABLE guest_assignments     ENABLE TRIGGER trg_check_guest_assignment_upd;
ALTER TABLE exhibitor_assignments ENABLE TRIGGER trg_check_exhibitor_assignment_ins;
ALTER TABLE exhibitor_assignments ENABLE TRIGGER trg_check_exhibitor_assignment_upd;
ALTER TABLE objects               ENABLE TRIGGER trg_check_object_geometry_ins;
ALTER TABLE objects               ENABLE TRIGGER trg_check_object_geometry_upd;
ALTER TABLE guests                ENABLE TRIGGER trg_normalize_email_guests_ins;
ALTER TABLE guests                ENABLE TRIGGER trg_normalize_email_guests_upd;
ALTER TABLE exhibitors            ENABLE TRIGGER trg_normalize_email_exhibitors_ins;
ALTER TABLE exhibitors            ENABLE TRIGGER trg_normalize_email_exhibitors_upd;
ALTER TABLE events                ENABLE TRIGGER trg_touch_events_upd;
ALTER TABLE canvases              ENABLE TRIGGER trg_touch_canvases_upd;
ALTER TABLE tradeshow_routes      ENABLE TRIGGER trg_touch_routes_upd;


-- =========================================================
-- Tableplanner v2.1 — Extended Object Types (Door & Power Outlet)
-- 新增对象类型：门和插座支持
-- =========================================================

-- ========== 新增对象类型说明 ==========
-- 以下对象类型可用于 objects.obj_type 字段：
--
-- 1) 门类型 (Doors)
--    - 'door1': 门样式1，默认尺寸 1.2m × 0.8m
--    - 'door2': 门样式2，默认尺寸 1.2m × 0.8m
--
-- 2) 插座 (Power Outlets)
--    - 'power_outlet': 电源插座，默认尺寸 0.3m × 0.3m
--
-- 3) 其他设施 (Other Facilities)
--    - 'window': 窗户，默认尺寸 2.0m × 0.3m
--    - 'tactile_paving': 盲道，默认尺寸 1.0m × 5.0m
--
-- ========== meta_json 字段使用规范 ==========
-- meta_json 可存储对象的扩展属性，建议格式：
-- {
--   "image": "/door1.jpg",           // 对象图片路径
--   "color": "#E0F2F1",              // 填充颜色
--   "stroke": "#009688",             // 边框颜色
--   "icon": "🚪",                     // 显示图标
--   "pattern": "dots",               // 特殊图案（如盲道）
--   "properties": {                  // 对象特定属性
--     "door_type": "single",         // 门类型: single/double/sliding
--     "outlet_type": "standard",     // 插座类型: standard/usb/three_phase
--     "power_rating": "220V"         // 功率等级
--   }
-- }

-- ========== 示例数据：创建带门和插座的会议室 ==========
-- 以下是一个完整示例，展示如何创建包含门和插座的会议室布局

/*
-- 创建会议活动
INSERT INTO events (name, type, description, venue, start_time, is_public)
VALUES (
  'Tech Conference 2024',
  'conference',
  'Annual Technology Conference',
  'Conference Center A',
  '2024-12-01 09:00:00+08',
  false
) RETURNING id; -- 假设返回 event_id = 1

-- 创建画布（会议室平面图）
INSERT INTO canvases (event_id, name, width, height, scale_ratio)
VALUES (
  1,                           -- event_id
  'Main Conference Hall',      -- name
  2400,                        -- width (24m × 100px/m)
  1600,                        -- height (16m × 100px/m)
  1.0                          -- scale_ratio
) RETURNING id; -- 假设返回 canvas_id = 1

-- 添加门对象
INSERT INTO objects (canvas_id, obj_type, label, position_x, position_y, width, height, rotation, meta_json)
VALUES
  -- 主入口门（门样式1）
  (1, 'door1', 'Main Entrance', 200, 0, 120, 80, 0, 
   '{"image": "/door1.jpg", "color": "#E0F2F1", "stroke": "#009688", "icon": "🚪", 
     "properties": {"door_type": "double", "direction": "inward"}}'::jsonb),
  
  -- 侧门（门样式2）
  (1, 'door2', 'Side Exit', 2000, 0, 120, 80, 0,
   '{"image": "/door2.jpg", "color": "#E0F2F1", "stroke": "#009688", "icon": "🚪",
     "properties": {"door_type": "single", "direction": "outward", "emergency_exit": true}}'::jsonb);

-- 添加插座对象
INSERT INTO objects (canvas_id, obj_type, label, position_x, position_y, width, height, meta_json)
VALUES
  -- 前排左侧插座
  (1, 'power_outlet', 'Outlet-L1', 200, 400, 30, 30,
   '{"image": "/plugin.jpg", "color": "#FFF9C4", "stroke": "#F57C00", "icon": "🔌",
     "properties": {"outlet_type": "standard", "power_rating": "220V", "ports": 4}}'::jsonb),
  
  -- 前排右侧插座
  (1, 'power_outlet', 'Outlet-R1', 2170, 400, 30, 30,
   '{"image": "/plugin.jpg", "color": "#FFF9C4", "stroke": "#F57C00", "icon": "🔌",
     "properties": {"outlet_type": "usb", "power_rating": "220V", "ports": 6, "usb_ports": 2}}'::jsonb),
  
  -- 后排中央插座
  (1, 'power_outlet', 'Outlet-C1', 1185, 1200, 30, 30,
   '{"image": "/plugin.jpg", "color": "#FFF9C4", "stroke": "#F57C00", "icon": "🔌",
     "properties": {"outlet_type": "three_phase", "power_rating": "380V", "ports": 2}}'::jsonb);

-- 添加窗户
INSERT INTO objects (canvas_id, obj_type, label, position_x, position_y, width, height, meta_json)
VALUES
  (1, 'window', 'Window-North', 800, 1580, 800, 20,
   '{"color": "#E1F5FE", "stroke": "#03A9F4", "icon": "🪟"}'::jsonb);

-- 添加盲道（无障碍设施）
INSERT INTO objects (canvas_id, obj_type, label, position_x, position_y, width, height, meta_json)
VALUES
  (1, 'tactile_paving', 'Accessible Path', 320, 100, 100, 1400,
   '{"color": "#FFF9C4", "stroke": "#F9A825", "icon": "🦯", "pattern": "dots"}'::jsonb);

-- 添加传统会议桌椅
INSERT INTO objects (canvas_id, obj_type, label, position_x, position_y, width, height, seats, meta_json)
VALUES
  -- 圆桌
  (1, 'table_round', 'Table-1', 600, 400, 180, 180, 8,
   '{"color": "#E8F4FD", "stroke": "#2196F3"}'::jsonb),
  
  -- 方桌
  (1, 'table_rect', 'Table-2', 1200, 400, 240, 120, 6,
   '{"color": "#FFF3E0", "stroke": "#FF9800"}'::jsonb),
  
  -- 主席台
  (1, 'stage', 'Main Stage', 800, 100, 800, 200,
   '{"color": "#FFEBEE", "stroke": "#F44336"}'::jsonb),
  
  -- 讲台
  (1, 'podium', 'Podium-1', 1150, 250, 100, 60,
   '{"color": "#E8EAF6", "stroke": "#3F51B5"}'::jsonb);
*/

-- ========== 查询示例 ==========
-- 查询某个画布上的所有门
-- SELECT * FROM objects WHERE canvas_id = 1 AND obj_type IN ('door1', 'door2');

-- 查询某个画布上的所有插座
-- SELECT * FROM objects WHERE canvas_id = 1 AND obj_type = 'power_outlet';

-- 查询所有设施类对象（门、插座、窗户、盲道）
-- SELECT * FROM objects 
-- WHERE canvas_id = 1 
--   AND obj_type IN ('door1', 'door2', 'power_outlet', 'window', 'tactile_paving');

-- 查询特定类型的插座（通过 meta_json）
-- SELECT * FROM objects 
-- WHERE canvas_id = 1 
--   AND obj_type = 'power_outlet'
--   AND meta_json->'properties'->>'outlet_type' = 'usb';

-- 统计各类型对象数量
-- SELECT obj_type, COUNT(*) as count 
-- FROM objects 
-- WHERE canvas_id = 1 
-- GROUP BY obj_type 
-- ORDER BY count DESC;