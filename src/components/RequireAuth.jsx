import { useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import * as AuthAPI from "../server-actions/auth";

export default function RequireAuth({ children }) {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const authed = !!AuthAPI.getAuthToken();
    if (!authed) {
      const redirect = encodeURIComponent(location.pathname + location.search);
      navigate(`/login?redirect=${redirect}`);
    }
  }, [location.pathname, location.search, navigate]);

  return children;
}


