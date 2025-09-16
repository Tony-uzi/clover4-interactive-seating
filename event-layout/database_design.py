import sqlite3
from pathlib import Path

DB_FILE = Path(__file__).with_suffix(".sqlite")

DDL_SQL = """
PRAGMA foreign_keys = ON;

CREATE TABLE users (
    id            INTEGER PRIMARY KEY AUTOINCREMENT,
    name          TEXT,
    email         TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    locale        TEXT,
    created_at    TEXT DEFAULT (datetime('now')),
    updated_at    TEXT DEFAULT (datetime('now'))
);

CREATE TABLE organizations (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    name       TEXT NOT NULL,
    created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE org_members (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    org_id     INTEGER NOT NULL REFERENCES organizations(id),
    user_id    INTEGER NOT NULL REFERENCES users(id),
    role       TEXT NOT NULL,
    created_at TEXT DEFAULT (datetime('now')),
    UNIQUE (org_id, user_id)
);

-- 2. 场地
CREATE TABLE venues (
    id      INTEGER PRIMARY KEY AUTOINCREMENT,
    org_id  INTEGER NOT NULL REFERENCES organizations(id),
    name    TEXT NOT NULL,
    address TEXT,
    city    TEXT,
    country TEXT,
    notes   TEXT
);

CREATE TABLE rooms (
    id       INTEGER PRIMARY KEY AUTOINCREMENT,
    venue_id INTEGER NOT NULL REFERENCES venues(id),
    name     TEXT NOT NULL,
    capacity INTEGER,
    floor_no INTEGER,
    notes    TEXT
);

-- 3. 活动
CREATE TABLE events (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    org_id      INTEGER NOT NULL REFERENCES organizations(id),
    venue_id    INTEGER REFERENCES venues(id),
    name        TEXT NOT NULL,
    type        TEXT,
    start_at    TEXT,
    end_at      TEXT,
    timezone    TEXT,
    description TEXT,
    created_at  TEXT DEFAULT (datetime('now')),
    updated_at  TEXT DEFAULT (datetime('now'))
);

CREATE INDEX idx_events_org_start ON events(org_id, start_at);

CREATE TABLE event_members (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    event_id   INTEGER NOT NULL REFERENCES events(id),
    user_id    INTEGER NOT NULL REFERENCES users(id),
    role       TEXT NOT NULL,
    created_at TEXT DEFAULT (datetime('now')),
    UNIQUE (event_id, user_id)
);

-- 4. 平面图
CREATE TABLE floorplans (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    event_id    INTEGER NOT NULL REFERENCES events(id),
    room_id     INTEGER REFERENCES rooms(id),
    name        TEXT NOT NULL,
    width_px    INTEGER,
    height_px   INTEGER,
    scale_ratio REAL,
    is_active   INTEGER DEFAULT 0,
    created_at  TEXT DEFAULT (datetime('now')),
    updated_at  TEXT DEFAULT (datetime('now'))
);

CREATE TABLE layout_objects (
    id           INTEGER PRIMARY KEY AUTOINCREMENT,
    floorplan_id INTEGER NOT NULL REFERENCES floorplans(id),
    obj_type     TEXT NOT NULL,   -- 'table'|'booth'|'shape'|'text'|'image'
    label        TEXT,
    x            REAL,
    y            REAL,
    width        REAL,
    height       REAL,
    rotation     REAL,
    z_index      INTEGER DEFAULT 0,
    locked       INTEGER DEFAULT 0,
    visible      INTEGER DEFAULT 1,
    opacity      REAL DEFAULT 1.0,
    parent_id    INTEGER REFERENCES layout_objects(id),
    meta_json    TEXT
);

CREATE INDEX idx_layout_objects_floorplan ON layout_objects(floorplan_id);

-- 5. 座位
CREATE TABLE seats (
    id            INTEGER PRIMARY KEY AUTOINCREMENT,
    floorplan_id  INTEGER NOT NULL REFERENCES floorplans(id),
    table_id      INTEGER REFERENCES layout_objects(id),
    label         TEXT,
    x             REAL,
    y             REAL,
    angle         REAL,
    meta_json     TEXT,
    is_accessible INTEGER DEFAULT 0
);

CREATE INDEX idx_seats_floorplan ON seats(floorplan_id);

-- 6. 参会人
CREATE TABLE attendees (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    event_id        INTEGER NOT NULL REFERENCES events(id),
    first_name      TEXT,
    last_name       TEXT,
    email           TEXT,
    phone           TEXT,
    org_name        TEXT,
    role            TEXT,
    dietary_notes   TEXT,
    accessibility   TEXT,
    notes           TEXT,
    created_at      TEXT DEFAULT (datetime('now'))
);

CREATE UNIQUE INDEX uq_attendees_event_email ON attendees(event_id, email) WHERE email IS NOT NULL;
CREATE INDEX idx_attendees_name ON attendees(event_id, last_name, first_name);

-- 7. 标签
CREATE TABLE tags (
    id       INTEGER PRIMARY KEY AUTOINCREMENT,
    event_id INTEGER NOT NULL REFERENCES events(id),
    name     TEXT NOT NULL,
    color    TEXT,
    UNIQUE (event_id, name)
);

CREATE INDEX idx_tags_event ON tags(event_id);

CREATE TABLE attendee_tags (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    attendee_id INTEGER NOT NULL REFERENCES attendees(id),
    tag_id      INTEGER NOT NULL REFERENCES tags(id),
    UNIQUE (attendee_id, tag_id)
);

-- 8. RSVP
CREATE TABLE rsvps (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    attendee_id INTEGER NOT NULL REFERENCES attendees(id),
    status      TEXT NOT NULL, -- pending/accepted/declined/waitlist/cancelled
    response_at TEXT,
    plus_ones   INTEGER,
    message     TEXT
);

-- 9. 票
CREATE TABLE tickets (
    id            INTEGER PRIMARY KEY AUTOINCREMENT,
    event_id      INTEGER NOT NULL REFERENCES events(id),
    attendee_id   INTEGER NOT NULL REFERENCES attendees(id),
    ticket_type   TEXT NOT NULL DEFAULT 'general',
    qr_token_hash TEXT UNIQUE,
    issued_at     TEXT DEFAULT (datetime('now')),
    UNIQUE (event_id, attendee_id)
);

CREATE INDEX idx_tickets_event_att ON tickets(event_id, attendee_id);

-- 10. 签到
CREATE TABLE checkins (
    id            INTEGER PRIMARY KEY AUTOINCREMENT,
    event_id      INTEGER NOT NULL REFERENCES events(id),
    attendee_id   INTEGER NOT NULL REFERENCES attendees(id),
    via           TEXT NOT NULL DEFAULT 'qr',
    checked_in_at TEXT DEFAULT (datetime('now'))
);

CREATE INDEX idx_checkins_event_time ON checkins(event_id, checked_in_at);

-- 11. 座位分配
CREATE TABLE seat_assignments (
    id           INTEGER PRIMARY KEY AUTOINCREMENT,
    event_id     INTEGER NOT NULL REFERENCES events(id),
    seat_id      INTEGER NOT NULL REFERENCES seats(id),
    attendee_id  INTEGER NOT NULL REFERENCES attendees(id),
    assigned_by  INTEGER REFERENCES users(id),
    assigned_at  TEXT DEFAULT (datetime('now')),
    UNIQUE (event_id, seat_id),
    UNIQUE (event_id, attendee_id)
);

-- 12. 展商
CREATE TABLE exhibitors (
    id            INTEGER PRIMARY KEY AUTOINCREMENT,
    event_id      INTEGER NOT NULL REFERENCES events(id),
    name          TEXT NOT NULL,
    contact_email TEXT,
    phone         TEXT,
    notes         TEXT
);

CREATE TABLE booth_allocations (
    id               INTEGER PRIMARY KEY AUTOINCREMENT,
    event_id         INTEGER NOT NULL REFERENCES events(id),
    exhibitor_id     INTEGER NOT NULL REFERENCES exhibitors(id),
    booth_object_id  INTEGER NOT NULL REFERENCES layout_objects(id),
    allocated_at     TEXT DEFAULT (datetime('now')),
    UNIQUE (event_id, booth_object_id),
    UNIQUE (event_id, exhibitor_id)
);

-- 13. 版本 & 日志
CREATE TABLE layout_versions (
    id           INTEGER PRIMARY KEY AUTOINCREMENT,
    floorplan_id INTEGER NOT NULL REFERENCES floorplans(id),
    version_no   INTEGER NOT NULL,
    created_by   INTEGER REFERENCES users(id),
    created_at   TEXT DEFAULT (datetime('now')),
    notes        TEXT,
    UNIQUE (floorplan_id, version_no)
);

CREATE TABLE change_logs (
    id           INTEGER PRIMARY KEY AUTOINCREMENT,
    event_id     INTEGER NOT NULL REFERENCES events(id),
    user_id      INTEGER REFERENCES users(id),
    action       TEXT NOT NULL,
    target_table TEXT NOT NULL,
    target_id    INTEGER,
    before       TEXT,
    after        TEXT,
    created_at   TEXT DEFAULT (datetime('now'))
);

CREATE INDEX idx_change_logs_event_time ON change_logs(event_id, created_at);

-- 14. 导入
CREATE TABLE imports (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    event_id    INTEGER NOT NULL REFERENCES events(id),
    source      TEXT,
    file_name   TEXT,
    mapping     TEXT,
    status      TEXT NOT NULL DEFAULT 'pending',
    created_by  INTEGER REFERENCES users(id),
    created_at  TEXT DEFAULT (datetime('now')),
    finished_at TEXT
);

CREATE INDEX idx_imports_event_time ON imports(event_id, created_at);

CREATE TABLE import_rows (
    id           INTEGER PRIMARY KEY AUTOINCREMENT,
    import_id    INTEGER NOT NULL REFERENCES imports(id),
    row_num      INTEGER NOT NULL,
    raw          TEXT,
    valid        INTEGER,
    error        TEXT,
    upsert_table TEXT,
    upsert_id    INTEGER,
    created_at   TEXT DEFAULT (datetime('now'))
);

CREATE INDEX idx_import_rows_import ON import_rows(import_id);
"""

def main():
    # 如果库文件已存在，先删掉
    if DB_FILE.exists():
        DB_FILE.unlink()
    conn = sqlite3.connect(DB_FILE)
    conn.executescript(DDL_SQL)
    conn.commit()
    conn.close()
    print(f"SQLite 数据库已生成：{DB_FILE.resolve()}")

if __name__ == "__main__":
    main()