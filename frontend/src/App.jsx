import { useEffect, useState } from "react";
import { MapContainer, TileLayer, Marker, useMapEvents } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import "./App.css";

const API_URL = "http://localhost:5000/api";

const incidentIcon = new L.Icon({
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

function LocationPicker({ position, onLocationSelect }) {
  useMapEvents({
    click(event) {
      onLocationSelect({
        latitude: event.latlng.lat.toFixed(7),
        longitude: event.latlng.lng.toFixed(7),
      });
    },
  });

  return position ? (
    <Marker
      position={[Number(position.latitude), Number(position.longitude)]}
      icon={incidentIcon}
    />
  ) : null;
}


function normalizeRole(value) {
  if (value && typeof value === "object") {
    value = value.name || value.role_name || value.roleName || value.role;
  }
  if (typeof value === "number" || /^\d+$/.test(String(value ?? ""))) {
    const id = Number(value);
    if (id === 1) return "ADMIN";
    if (id === 2) return "RESPONDER";
    if (id === 3) return "CITIZEN";
  }
  const role = String(value || "").trim().toUpperCase();
  if (role.includes("ADMIN")) return "ADMIN";
  if (role.includes("RESPONDER")) return "RESPONDER";
  if (role.includes("CITIZEN")) return "CITIZEN";
  return "";
}

function getRole(currentUser, currentToken) {
  const userRole =
    normalizeRole(currentUser?.role) ||
    normalizeRole(currentUser?.role_name) ||
    normalizeRole(currentUser?.roleName) ||
    normalizeRole(currentUser?.role_id) ||
    normalizeRole(currentUser?.roleId) ||
    normalizeRole(currentUser?.role?.name);

  if (userRole) return userRole;

  try {
    const payloadPart = currentToken?.split(".")?.[1];
    if (payloadPart) {
      const base64 = payloadPart.replace(/-/g, "+").replace(/_/g, "/");
      const payload = JSON.parse(
        decodeURIComponent(
          atob(base64)
            .split("")
            .map((char) => `%${char.charCodeAt(0).toString(16).padStart(2, "0")}`)
            .join("")
        )
      );
      return (
        normalizeRole(payload.role) ||
        normalizeRole(payload.role_name) ||
        normalizeRole(payload.roleName) ||
        normalizeRole(payload.role_id) ||
        normalizeRole(payload.roleId) ||
        ""
      );
    }
  } catch {
    // The backend remains responsible for authorization; this only selects UI.
  }

  return "CITIZEN";
}

function App() {
  const [user, setUser] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("saferoute_user")) || null;
    } catch {
      return null;
    }
  });
  const [token, setToken] = useState(
    () => localStorage.getItem("saferoute_token") || ""
  );
  // Returning users go straight to their authenticated dashboard.
  const [page, setPage] = useState(() => {
    const savedToken = localStorage.getItem("saferoute_token") || "";
    if (!savedToken) return "home";
    try {
      const savedUser = JSON.parse(localStorage.getItem("saferoute_user")) || null;
      return getRole(savedUser, savedToken) ? "dashboard" : "home";
    } catch {
      return "home";
    }
  });
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [incidentTypes, setIncidentTypes] = useState([]);
  const [incidents, setIncidents] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [assignedIncidentIds, setAssignedIncidentIds] = useState({});
  const [responderId, setResponderId] = useState("4");
  const [assignmentNotes, setAssignmentNotes] = useState("");
  const [notifications, setNotifications] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);

  const [loginForm, setLoginForm] = useState({
    email: "",
    password: "",
  });

  const [registerForm, setRegisterForm] = useState({
    first_name: "",
    last_name: "",
    email: "",
    phone: "",
    password: "",
  });

  const [incidentForm, setIncidentForm] = useState({
    incident_type_id: "",
    title: "",
    description: "",
    severity: "MEDIUM",
    latitude: "",
    longitude: "",
    address: "",
  });

  async function request(endpoint, options = {}, authToken = token) {
    const response = await fetch(`${API_URL}${endpoint}`, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
        ...options.headers,
      },
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok || data.success === false) {
      throw new Error(data.message || `Request failed (${response.status})`);
    }

    return data;
  }

  function saveSession(nextUser, nextToken) {
    setUser(nextUser);
    setToken(nextToken);
    localStorage.setItem("saferoute_user", JSON.stringify(nextUser));
    localStorage.setItem("saferoute_token", nextToken);
  }

  function navigate(nextPage) {
    setMessage("");
    const role = getRole(user, token);
    const isStaff = Boolean(token) && (role === "ADMIN" || role === "RESPONDER");

    // Admins and responders stay inside their role-specific dashboard.
    if (isStaff && nextPage !== "dashboard") {
      nextPage = "dashboard";
    }
    if (!token && (nextPage === "dashboard" || nextPage === "report")) {
      nextPage = "login";
    }

    setPage(nextPage);
    if (nextPage === "dashboard" && token) loadDashboardData(token, user);
    if (nextPage === "report" && token) loadIncidentTypes(token);
  }

  function logout() {
    localStorage.removeItem("saferoute_user");
    localStorage.removeItem("saferoute_token");
    setUser(null);
    setToken("");
    setIncidents([]);
    setAssignments([]);
    setNotifications([]);
    setShowNotifications(false);
    setIncidentTypes([]);
    setMessage("");
    setPage("home");
  }

  async function handleLogin(event) {
    event.preventDefault();
    setLoading(true);
    setMessage("");

    try {
      const data = await request(
        "/auth/login",
        {
          method: "POST",
          body: JSON.stringify(loginForm),
        },
        ""
      );

      if (!data.token) {
        throw new Error("Login response did not include a token.");
      }

      let loggedInUser = data.user || null;

      try {
        const profile = await request("/auth/me", {}, data.token);
        loggedInUser = profile.user || profile.data || loggedInUser;
      } catch {
        // Continue with the login response if profile loading fails.
      }

      if (!loggedInUser) {
        loggedInUser = {
          email: loginForm.email,
          role: data.role || "CITIZEN",
        };
      }

      saveSession(loggedInUser, data.token);
      setPage("dashboard");
      setMessage("Login successful!");
      await loadDashboardData(data.token, loggedInUser);
    } catch (error) {
      setMessage(error.message || "Login failed.");
    } finally {
      setLoading(false);
    }
  }

  async function handleRegister(event) {
    event.preventDefault();
    setLoading(true);
    setMessage("");

    try {
      await request(
        "/auth/register",
        {
          method: "POST",
          body: JSON.stringify({
            ...registerForm,
            role: "CITIZEN",
          }),
        },
        ""
      );

      setLoginForm({
        email: registerForm.email,
        password: "",
      });

      setPage("login");
      setMessage("Account created successfully! Please sign in.");
    } catch (error) {
      setMessage(error.message || "Registration failed.");
    } finally {
      setLoading(false);
    }
  }

  async function loadIncidentTypes(currentToken = token) {
    if (!currentToken) return;

    try {
      const data = await request("/incidents/types", {}, currentToken);
      setIncidentTypes(data.incident_types || data.types || []);
    } catch (error) {
      setMessage(error.message || "Could not load incident types.");
    }
  }

  async function loadDashboardData(currentToken = token, currentUser = user) {
    if (!currentToken) return;

    const role = getRole(currentUser, currentToken);
    setMessage("");

    try {
      // Notifications are available to every signed-in role.
      try {
        const notificationData = await request("/notifications", {}, currentToken);
        setNotifications(notificationData.notifications || []);
      } catch (notificationError) {
        console.warn("Could not load notifications:", notificationError.message);
      }
      if (role === "ADMIN") {
        // Admins see all incidents and their saved assignments so the UI
        // remains accurate after a refresh, not just until the page reloads.
        const data = await request("/incidents", {}, currentToken);
        const incidentRows = data.incidents || data.data || [];
        setIncidents(incidentRows);

        const assignmentResults = await Promise.allSettled(
          incidentRows.map((incident) =>
            request(`/assignments/incidents/${incident.id}/assignments`, {}, currentToken)
          )
        );
        const allAssignments = assignmentResults.flatMap((result) =>
          result.status === "fulfilled"
            ? (result.value.assignments || result.value.data || [])
            : []
        );
        setAssignments(allAssignments);
        setAssignedIncidentIds((current) => {
          const next = { ...current };
          incidentRows.forEach((incident) => {
            const rows = allAssignments.filter(
              (assignment) => Number(assignment.incident_id) === Number(incident.id)
            );
            if (rows.some((assignment) => !["DECLINED", "CANCELLED"].includes(String(assignment.status || "").toUpperCase()))) {
              next[incident.id] = true;
            } else {
              delete next[incident.id];
            }
          });
          return next;
        });
      } else if (role === "RESPONDER") {
        const data = await request("/assignments/my", {}, currentToken);
        setAssignments(data.assignments || data.data || []);
        setIncidents([]);
      } else {
        const results = await Promise.allSettled([
          request("/incidents/types", {}, currentToken),
          request("/incidents/my", {}, currentToken),
        ]);

        if (results[0].status === "fulfilled") {
          const data = results[0].value;
          setIncidentTypes(data.incident_types || data.types || []);
        }

        if (results[1].status === "fulfilled") {
          const data = results[1].value;
          setIncidents(data.incidents || data.data || []);
        } else {
          throw results[1].reason;
        }
        setAssignments([]);
      }
    } catch (error) {
      setMessage(error.message || "Could not load dashboard data.");
    }
  }

  async function handleStatusChange(incidentId, nextStatus) {
    const previousIncidents = incidents;
    setMessage("");

    // Update the UI immediately, then confirm the change with the API.
    setIncidents((current) =>
      current.map((incident) =>
        Number(incident.id) === Number(incidentId)
          ? { ...incident, status: nextStatus }
          : incident
      )
    );

    try {
      await request(
        `/incidents/${incidentId}/status`,
        {
          method: "PATCH",
          body: JSON.stringify({ status: nextStatus }),
        },
        token
      );
      setMessage(`Incident #${incidentId} status updated to ${nextStatus.replace("_", " ")}.`);
      await loadDashboardData(token, user);
    } catch (error) {
      setIncidents(previousIncidents);
      setMessage(error.message || "Could not update incident status.");
    }
  }

  async function handleDeclineIncident(incidentId) {
    const incident = incidents.find((item) => Number(item.id) === Number(incidentId));
    if (!incident) return;

    const confirmed = window.confirm(
      `Decline incident #${incidentId}? The citizen will be notified.`
    );
    if (!confirmed) return;

    await handleStatusChange(incidentId, "DECLINED");
  }

  async function handleCreateAssignment(incidentId) {
    if (!responderId) {
      setMessage("Please select a responder.");
      return;
    }

    setLoading(true);
    setMessage("");

    try {
      await request(
        `/assignments/incidents/${incidentId}/assignments`,
        {
          method: "POST",
          body: JSON.stringify({
            responder_id: Number(responderId),
            status: "ASSIGNED",
            notes: assignmentNotes.trim() || null,
          }),
        },
        token
      );

      setAssignedIncidentIds((current) => ({ ...current, [incidentId]: true }));
      setMessage(`Incident #${incidentId} assigned successfully to responder #${responderId}.`);
      setAssignmentNotes("");
      await loadDashboardData(token, user);
    } catch (error) {
      setMessage(error.message || "Could not assign responder.");
    } finally {
      setLoading(false);
    }
  }

  async function handleAssignmentResponse(assignmentId, nextStatus) {
    setLoading(true);
    setMessage("");
    try {
      await request(`/assignments/${assignmentId}`, {
        method: "PUT",
        body: JSON.stringify({ status: nextStatus }),
      }, token);
      setMessage(nextStatus === "ACCEPTED" ? "Assignment accepted." : "Assignment declined.");
      await loadDashboardData(token, user);
    } catch (error) {
      setMessage(error.message || `Could not ${nextStatus.toLowerCase()} assignment.`);
    } finally {
      setLoading(false);
    }
  }

  async function markNotificationRead(notificationId) {
    try {
      await request(`/notifications/${notificationId}/read`, { method: "PATCH" }, token);
      setNotifications((current) => current.map((item) =>
        Number(item.id) === Number(notificationId) ? { ...item, is_read: 1 } : item
      ));
    } catch (error) {
      setMessage(error.message || "Could not mark notification as read.");
    }
  }

  async function markAllNotificationsRead() {
    try {
      await request("/notifications/read-all", { method: "PATCH" }, token);
      setNotifications((current) => current.map((item) => ({ ...item, is_read: 1 })));
    } catch (error) {
      setMessage(error.message || "Could not mark notifications as read.");
    }
  }

  async function handleIncidentSubmit(event) {
    event.preventDefault();

    if (!incidentForm.latitude || !incidentForm.longitude) {
      setMessage("Please click on the map to select the incident location.");
      return;
    }

    setLoading(true);
    setMessage("");

    try {
      const payload = {
        ...incidentForm,
        incident_type_id: Number(incidentForm.incident_type_id),
        latitude: Number(incidentForm.latitude),
        longitude: Number(incidentForm.longitude),
      };

      await request("/incidents", {
        method: "POST",
        body: JSON.stringify(payload),
      });

      setIncidentForm({
        incident_type_id: "",
        title: "",
        description: "",
        severity: "MEDIUM",
        latitude: "",
        longitude: "",
        address: "",
      });

      setMessage("Incident reported successfully!");
      setPage("dashboard");
      await loadDashboardData(token, user);
    } catch (error) {
      setMessage(error.message || "Could not submit incident.");
    } finally {
      setLoading(false);
    }
  }

  function updateIncident(field, value) {
    setIncidentForm((previous) => ({
      ...previous,
      [field]: value,
    }));
  }

  const selectedPosition =
    incidentForm.latitude !== "" && incidentForm.longitude !== ""
      ? {
          latitude: incidentForm.latitude,
          longitude: incidentForm.longitude,
        }
      : null;

  const currentRole = getRole(user, token);
  const isStaffDashboardOnly = Boolean(token) &&
    (currentRole === "ADMIN" || currentRole === "RESPONDER");

  useEffect(() => {
    if (page === "dashboard" && token) {
      loadDashboardData(token, user);
    }
    // Run when entering the dashboard or when a session changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, token]);

  return (
    <div className="app">
      <header className="site-header">
        {isStaffDashboardOnly ? (
          <div className="brand" aria-label="SafeRoute dashboard">
            <span className="brand-icon" aria-hidden="true">🛡️</span>
            <span>
              <strong>SafeRoute</strong>
              <small>{currentRole === "ADMIN" ? "ADMIN DASHBOARD" : "RESPONDER DASHBOARD"}</small>
            </span>
          </div>
        ) : (
          <button className="brand" onClick={() => navigate(user ? "dashboard" : "home")}>
            <span className="brand-icon" aria-hidden="true">🛡️</span>
            <span>
              <strong>SafeRoute</strong>
              <small>SMART EMERGENCY RESPONSE</small>
            </span>
          </button>
        )}

        {!isStaffDashboardOnly && (
          <nav className="navigation">
            {!user && <button onClick={() => navigate("home")}>Home</button>}
            {user && <button onClick={() => navigate("dashboard")}>Dashboard</button>}
            {!user && <a href="#features" onClick={() => navigate("home")}>Features</a>}
          </nav>
        )}

        <div className="header-actions">
          {user ? (
            <button className="button button-outline" onClick={logout}>Logout</button>
          ) : (
            <>
              <button className="button button-outline" onClick={() => navigate("login")}>Log in</button>
              <button className="button button-primary" onClick={() => navigate("register")}>Get Started</button>
            </>
          )}
        </div>
      </header>

      {message && (
        <div className="message-banner" role="status">
          <span>{message}</span>
          <button
            onClick={() => setMessage("")}
            aria-label="Dismiss message"
          >
            ×
          </button>
        </div>
      )}

      <main>
        {page === "home" && !isStaffDashboardOnly && (
          <>
            <section className="hero">
              <div className="hero-content">
                <div className="eyebrow">
                  <span className="status-dot" />
                  SMARTER ROADS. FASTER RESPONSES.
                </div>

                <h1>
                  Every second
                  <br />
                  <span>can save a life.</span>
                </h1>

                <p className="hero-description">
                  Report road incidents, connect with emergency
                  responders, and help make every journey safer with
                  SafeRoute.
                </p>

                <div className="hero-actions">
                  <button
                    className="button button-primary button-large"
                    onClick={() => navigate(user ? "report" : "register")}
                  >
                    Report an Incident <span>→</span>
                  </button>
                  <button
                    className="button button-light button-large"
                    onClick={() => navigate(user ? "dashboard" : "login")}
                  >
                    {user ? "Open Dashboard" : "Sign In"}
                  </button>
                </div>

                <div className="hero-note">
                  <span className="note-icon">✓</span>
                  A connected community for safer roads
                </div>
              </div>

              <div className="hero-visual">
                <div className="visual-orbit orbit-one" />
                <div className="visual-orbit orbit-two" />

                <div className="visual-card visual-card-top">
                  <span className="visual-card-icon">📍</span>
                  <div>
                    <strong>Incident location</strong>
                    <small>Location-based reporting</small>
                  </div>
                  <span className="mini-indicator" />
                </div>

                <div className="road-illustration">
                  <div className="road-line" />
                  <div className="road-pin pin-one">+</div>
                  <div className="road-pin pin-two">!</div>
                  <div className="road-pin pin-three">+</div>
                  <div className="road-center">
                    <span>🛡️</span>
                  </div>
                </div>

                <div className="visual-card visual-card-bottom">
                  <span className="response-icon">✓</span>
                  <div>
                    <strong>Emergency response</strong>
                    <small>Connected when it matters</small>
                  </div>
                </div>
              </div>
            </section>

            <section className="trust-strip">
              <div>
                <span className="trust-symbol">◎</span>
                <span>
                  <strong>Quick reporting</strong>
                  <small>Share incident details</small>
                </span>
              </div>
              <div>
                <span className="trust-symbol">⌖</span>
                <span>
                  <strong>Location aware</strong>
                  <small>Identify incident locations</small>
                </span>
              </div>
              <div>
                <span className="trust-symbol">♧</span>
                <span>
                  <strong>Community safety</strong>
                  <small>Help keep roads safer</small>
                </span>
              </div>
            </section>

            <section className="features-section" id="features">
              <div className="section-heading">
                <span className="eyebrow">HOW SAFEROUTE HELPS</span>
                <h2>Safety starts with action.</h2>
                <p>
                  Tools designed to help people share information and
                  respond to road emergencies.
                </p>
              </div>

              <div className="feature-grid">
                <article className="feature-card">
                  <span className="feature-icon">📍</span>
                  <h3>Report incidents</h3>
                  <p>
                    Submit accidents, road hazards, breakdowns, and other
                    incidents through a straightforward reporting form.
                  </p>
                </article>
                <article className="feature-card">
                  <span className="feature-icon">🚑</span>
                  <h3>Emergency services</h3>
                  <p>
                    Keep emergency service information organized so
                    assistance can be found when needed.
                  </p>
                </article>
                <article className="feature-card">
                  <span className="feature-icon">🛡️</span>
                  <h3>Track updates</h3>
                  <p>
                    Keep incident information organized and follow its
                    status through the platform.
                  </p>
                </article>
              </div>
            </section>

            <section className="cta-section">
              <div>
                <span className="eyebrow">BE PART OF THE SOLUTION</span>
                <h2>Safer roads begin with us.</h2>
                <p>
                  Create an account to report and manage road incidents.
                </p>
              </div>
              <button
                className="button button-primary button-large"
                onClick={() => navigate(user ? "dashboard" : "register")}
              >
                {user ? "Go to Dashboard" : "Join SafeRoute"} →
              </button>
            </section>
          </>
        )}

        {page === "login" && (
          <section className="auth-page">
            <div className="auth-decoration">
              <span className="auth-decoration-icon">🛡️</span>
              <h2>Welcome back.</h2>
              <p>
                Sign in to access your SafeRoute account and manage
                incident reports.
              </p>
            </div>

            <form
              className="form-card"
              onSubmit={handleLogin}
            >
              <span className="eyebrow">YOUR SAFEROUTE ACCOUNT</span>
              <h1>Sign in</h1>
              <p className="form-subtitle">
                Enter your account details to continue.
              </p>

              <label htmlFor="login-email">Email address</label>
              <input
                id="login-email"
                type="email"
                autoComplete="email"
                value={loginForm.email}
                onChange={(event) =>
                  setLoginForm({ ...loginForm, email: event.target.value })
                }
                required
              />

              <label htmlFor="login-password">Password</label>
              <input
                id="login-password"
                type="password"
                autoComplete="current-password"
                value={loginForm.password}
                onChange={(event) =>
                  setLoginForm({
                    ...loginForm,
                    password: event.target.value,
                  })
                }
                required
              />

              <button
                className="button button-primary button-full"
                type="submit"
                disabled={loading}
              >
                {loading ? "Signing in..." : "Sign In"}
              </button>

              <p className="form-switch">
                Don't have an account?{" "}
                <button type="button" onClick={() => navigate("register")}>
                  Create account
                </button>
              </p>

              <button
                type="button"
                className="back-home"
                onClick={() => navigate("home")}
              >
                ← Back to home
              </button>
            </form>
          </section>
        )}

        {page === "register" && (
          <section className="auth-page">
            <div className="auth-decoration">
              <span className="auth-decoration-icon">🛡️</span>
              <h2>Join a safer community.</h2>
              <p>
                Create your SafeRoute citizen account to report road
                incidents and help make roads safer.
              </p>
            </div>

            <form className="form-card" onSubmit={handleRegister}>
              <span className="eyebrow">GET STARTED WITH SAFEROUTE</span>
              <h1>Create account</h1>
              <p className="form-subtitle">
                Register your citizen account.
              </p>

              <div className="form-row">
                <div>
                  <label htmlFor="register-first">First name</label>
                  <input
                    id="register-first"
                    value={registerForm.first_name}
                    onChange={(event) =>
                      setRegisterForm({
                        ...registerForm,
                        first_name: event.target.value,
                      })
                    }
                    required
                  />
                </div>
                <div>
                  <label htmlFor="register-last">Last name</label>
                  <input
                    id="register-last"
                    value={registerForm.last_name}
                    onChange={(event) =>
                      setRegisterForm({
                        ...registerForm,
                        last_name: event.target.value,
                      })
                    }
                    required
                  />
                </div>
              </div>

              <label htmlFor="register-email">Email address</label>
              <input
                id="register-email"
                type="email"
                value={registerForm.email}
                onChange={(event) =>
                  setRegisterForm({
                    ...registerForm,
                    email: event.target.value,
                  })
                }
                required
              />

              <label htmlFor="register-phone">Phone number</label>
              <input
                id="register-phone"
                type="tel"
                value={registerForm.phone}
                onChange={(event) =>
                  setRegisterForm({
                    ...registerForm,
                    phone: event.target.value,
                  })
                }
                required
              />

              <label htmlFor="register-password">Password</label>
              <input
                id="register-password"
                type="password"
                minLength={8}
                value={registerForm.password}
                onChange={(event) =>
                  setRegisterForm({
                    ...registerForm,
                    password: event.target.value,
                  })
                }
                required
              />

              <button
                className="button button-primary button-full"
                type="submit"
                disabled={loading}
              >
                {loading ? "Creating account..." : "Create Account"}
              </button>

              <p className="form-switch">
                Already registered?{" "}
                <button type="button" onClick={() => navigate("login")}>
                  Sign in
                </button>
              </p>

              <button
                type="button"
                className="back-home"
                onClick={() => navigate("home")}
              >
                ← Back to home
              </button>
            </form>
          </section>
        )}

        {page === "dashboard" && (
          <section className="dashboard-page">
            {(() => {
              const role = getRole(user, token);
              const isAdmin = role === "ADMIN";
              const isResponder = role === "RESPONDER";
              const pendingCount = incidents.filter((incident) =>
                ["PENDING", "REPORTED", "OPEN"].includes(
                  String(incident.status || "").toUpperCase()
                )
              ).length;
              const resolvedCount = incidents.filter((incident) =>
                ["RESOLVED", "COMPLETED", "CLOSED"].includes(
                  String(incident.status || "").toUpperCase()
                )
              ).length;
              const inProgressCount = incidents.filter((incident) =>
                ["IN_PROGRESS", "IN PROGRESS"].includes(String(incident.status || "").toUpperCase())
              ).length;
              const declinedCount = incidents.filter((incident) =>
                String(incident.status || "").toUpperCase() === "DECLINED"
              ).length;

              return (
                <>
                  <div className="dashboard-heading">
                    <div>
                      <span className="eyebrow">
                        {isAdmin ? "ADMIN CONTROL PANEL" : isResponder ? "RESPONDER DASHBOARD" : "CITIZEN DASHBOARD"}
                      </span>
                      <h1>
                        {isAdmin ? "Incident Management" : isResponder ? "My Assignments" : `Welcome${user?.first_name ? `, ${user.first_name}` : " back"}!`}
                      </h1>
                      <p>
                        {isAdmin
                          ? "Review citizen reports and monitor road incidents."
                          : isResponder
                            ? "Review and follow up on incidents assigned to you."
                            : "Manage your road incident reports from one place."}
                      </p>
                    </div>

                    {!isAdmin && !isResponder && (
                      <button className="button button-primary" onClick={() => navigate("report")}>
                        + Report an Incident
                      </button>
                    )}
                    <button className="button button-outline" onClick={() => loadDashboardData(token, user)}>
                      Refresh
                    </button>
                    <div style={{ position: "relative" }}>
                      <button className="button button-outline" type="button" onClick={() => setShowNotifications((value) => !value)} aria-expanded={showNotifications}>
                        🔔 Notifications {notifications.filter((item) => !item.is_read && item.is_read !== 1).length + notifications.filter((item) => Number(item.is_read) === 0).length > 0 ? `(${notifications.filter((item) => Number(item.is_read) === 0 || item.is_read === false).length})` : ""}
                      </button>
                      {showNotifications && (
                        <div style={{ position: "absolute", zIndex: 1000, right: 0, top: "calc(100% + 8px)", width: "min(360px, 85vw)", maxHeight: 380, overflowY: "auto", background: "white", border: "1px solid #d7dee8", borderRadius: 12, boxShadow: "0 12px 30px rgba(0,0,0,.14)", padding: 14, color: "#172033" }}>
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8 }}>
                            <strong>Notifications</strong>
                            <button type="button" className="button button-outline" style={{ padding: "5px 8px", fontSize: 12 }} onClick={markAllNotificationsRead}>Mark all read</button>
                          </div>
                          {notifications.length === 0 ? <p style={{ marginBottom: 4 }}>No notifications yet.</p> : notifications.map((notification) => (
                            <div key={notification.id} style={{ padding: "10px 0", borderBottom: "1px solid #edf0f5", opacity: Number(notification.is_read) === 1 ? 0.65 : 1 }}>
                              <strong>{notification.title || "SafeRoute notification"}</strong>
                              <p style={{ margin: "4px 0", fontSize: 13 }}>{notification.message}</p>
                              <small>{notification.created_at ? new Date(notification.created_at).toLocaleString() : ""}</small>
                              {Number(notification.is_read) !== 1 && <div><button type="button" className="button button-outline" style={{ padding: "5px 8px", marginTop: 6, fontSize: 12 }} onClick={() => markNotificationRead(notification.id)}>Mark as read</button></div>}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  {!isResponder ? (
                    <>
                      <div className="stats-grid">
                        <article className="stat-card">
                          <span className="stat-icon">📋</span>
                          <span className="stat-label">{isAdmin ? "All Incidents" : "My Reports"}</span>
                          <strong>{incidents.length}</strong>
                        </article>
                        <article className="stat-card">
                          <span className="stat-icon">🕒</span>
                          <span className="stat-label">Pending</span>
                          <strong>{pendingCount}</strong>
                        </article>
                        <article className="stat-card">
                          <span className="stat-icon">⏳</span>
                          <span className="stat-label">In progress</span>
                          <strong>{inProgressCount}</strong>
                        </article>
                        <article className="stat-card">
                          <span className="stat-icon">✓</span>
                          <span className="stat-label">Resolved</span>
                          <strong>{resolvedCount}</strong>
                        </article>
                        {isAdmin && (
                          <article className="stat-card">
                            <span className="stat-icon">✕</span>
                            <span className="stat-label">Declined</span>
                            <strong>{declinedCount}</strong>
                          </article>
                        )}
                      </div>

                      <div className="dashboard-panel">
                        <div className="panel-heading">
                          <div>
                            <h2>{isAdmin ? "All reported incidents" : "My incident reports"}</h2>
                            <p>{isAdmin ? "Incidents submitted by citizens across SafeRoute." : "Review the incidents you have submitted."}</p>
                          </div>
                        </div>

                        {incidents.length === 0 ? (
                          <div className="empty-state">
                            <span>📋</span>
                            <h3>{isAdmin ? "No incidents found" : "No incident reports yet"}</h3>
                            <p>
                              {isAdmin
                                ? "Citizen reports will appear here when submitted."
                                : "When you report an incident, it will appear here."}
                            </p>
                            {!isAdmin && (
                              <button className="button button-primary" onClick={() => navigate("report")}>
                                Report your first incident
                              </button>
                            )}
                          </div>
                        ) : (
                          <div className="incident-list">
                            {incidents.map((incident) => (
                              <article className="incident-item" key={incident.id}>
                                <div className="incident-item-icon">⚠</div>
                                <div className="incident-item-content">
                                  <h3>{incident.title || "Road incident"}</h3>
                                  <p>{incident.address || "Location not specified"}</p>
                                  <small>
                                    {incident.status || "Reported"} · {incident.severity || "Normal"}
                                    {isAdmin && (incident.user_name || incident.reporter_name || incident.email)
                                      ? ` · Reported by ${incident.user_name || incident.reporter_name || incident.email}`
                                      : ""}
                                  </small>
                                </div>
                                {isAdmin && (
                                  <label
                                    className="incident-status-control"
                                    style={{
                                      display: "flex",
                                      flexDirection: "column",
                                      gap: "6px",
                                      minWidth: "150px",
                                      marginLeft: "12px",
                                      fontSize: "12px",
                                      fontWeight: 600,
                                    }}
                                  >
                                    Update status
                                    <select
                                      aria-label={`Status for incident ${incident.id}`}
                                      value={String(incident.status || "PENDING").toUpperCase()}
                                      onChange={(event) =>
                                        handleStatusChange(incident.id, event.target.value)
                                      }
                                      style={{
                                        padding: "9px 10px",
                                        borderRadius: "8px",
                                        border: "1px solid #d7dee8",
                                        background: "#fff",
                                        color: "#172033",
                                        font: "inherit",
                                      }}
                                    >
                                      <option value="PENDING">Pending</option>
                                      <option value="IN_PROGRESS">In progress</option>
                                      <option value="RESOLVED">Resolved</option>
                                      <option value="DECLINED">Declined</option>
                                    </select>
                                  </label>
                                )}
                                {isAdmin && (
                                  <div
                                    className="incident-assignment-control"
                                    style={{
                                      display: "flex",
                                      flexDirection: "column",
                                      gap: "6px",
                                      minWidth: "190px",
                                      marginLeft: "12px",
                                      fontSize: "12px",
                                      fontWeight: 600,
                                    }}
                                  >
                                    <label htmlFor={`responder-${incident.id}`}>
                                      Assign responder
                                    </label>
                                    <select
                                      id={`responder-${incident.id}`}
                                      value={responderId}
                                      onChange={(event) => setResponderId(event.target.value)}
                                      style={{
                                        padding: "9px 10px",
                                        borderRadius: "8px",
                                        border: "1px solid #d7dee8",
                                        background: "#fff",
                                        color: "#172033",
                                        font: "inherit",
                                      }}
                                    >
                                      <option value="4">Test Responder (User ID 4)</option>
                                    </select>
                                    <input
                                      aria-label={`Assignment notes for incident ${incident.id}`}
                                      value={assignmentNotes}
                                      onChange={(event) => setAssignmentNotes(event.target.value)}
                                      placeholder="Optional notes"
                                      style={{
                                        padding: "9px 10px",
                                        borderRadius: "8px",
                                        border: "1px solid #d7dee8",
                                        font: "inherit",
                                      }}
                                    />
                                    <button
                                      type="button"
                                      className="button button-primary"
                                      disabled={loading || Boolean(assignedIncidentIds[incident.id]) || String(incident.status || "").toUpperCase() === "DECLINED"}
                                      onClick={() => handleCreateAssignment(incident.id)}
                                      style={{ padding: "9px 12px" }}
                                    >
                                      {loading ? "Assigning..." : assignedIncidentIds[incident.id] ? "Assigned ✓" : "Assign"}
                                    </button>
                                    <button
                                      type="button"
                                      className="button button-outline"
                                      disabled={loading || String(incident.status || "").toUpperCase() === "DECLINED"}
                                      onClick={() => handleDeclineIncident(incident.id)}
                                      style={{
                                        padding: "9px 12px",
                                        borderColor: "#dc2626",
                                        color: "#dc2626",
                                      }}
                                    >
                                      {String(incident.status || "").toUpperCase() === "DECLINED" ? "Declined ✗" : "Decline incident"}
                                    </button>
                                    {assignments.some((assignment) => Number(assignment.incident_id) === Number(incident.id)) && (
                                      <small style={{ color: "#475569", marginTop: 3 }}>
                                        Assignment status: {String(assignments.filter((assignment) => Number(assignment.incident_id) === Number(incident.id)).slice(-1)[0]?.status || "ASSIGNED").replaceAll("_", " ")}
                                      </small>
                                    )}
                                  </div>
                                )}
                                <span className="incident-id">#{incident.id}</span>
                              </article>
                            ))}
                          </div>
                        )}
                      </div>
                    </>
                  ) : (
                    <div className="dashboard-panel">
                      <div className="panel-heading">
                        <div>
                          <h2>Assigned incidents</h2>
                          <p>Assignments linked to your responder account.</p>
                        </div>
                      </div>
                      {assignments.length === 0 ? (
                        <div className="empty-state">
                          <span>🚑</span>
                          <h3>No assignments yet</h3>
                          <p>Incidents assigned to you by an administrator will appear here.</p>
                        </div>
                      ) : (
                        <div className="incident-list">
                          {assignments.map((assignment) => {
                            const status = String(assignment.status || "ASSIGNED").toUpperCase();
                            const statusLabel = status === "ACCEPTED" ? "Accepted" : status === "DECLINED" ? "Rejected" : status.replaceAll("_", " ");
                            const latitude = assignment.latitude;
                            const longitude = assignment.longitude;
                            const mapUrl = latitude != null && longitude != null
                              ? `https://www.google.com/maps?q=${latitude},${longitude}`
                              : null;
                            return (
                              <article className="incident-item" key={assignment.id} style={{ alignItems: "flex-start" }}>
                                <div className="incident-item-icon">🚑</div>
                                <div className="incident-item-content" style={{ minWidth: 0, width: "100%" }}>
                                  <h3>{assignment.incident_title || `Incident #${assignment.incident_id}`}</h3>
                                  <p><strong>Type:</strong> {assignment.incident_type_name || "Not specified"} · <strong>Severity:</strong> {assignment.severity || "Not specified"}</p>
                                  <p><strong>Description:</strong> {assignment.incident_description || "No description provided."}</p>
                                  <p><strong>Location:</strong> {assignment.address || "Address not provided"}</p>
                                  {mapUrl && <p><a href={mapUrl} target="_blank" rel="noreferrer">Open incident location in map</a></p>}
                                  <p><strong>Reported by:</strong> {[assignment.citizen_first_name, assignment.citizen_last_name].filter(Boolean).join(" ") || "Citizen"}</p>
                                  {assignment.citizen_phone && <p><strong>Citizen phone:</strong> {assignment.citizen_phone}</p>}
                                  {assignment.citizen_email && <p><strong>Citizen email:</strong> {assignment.citizen_email}</p>}
                                  <p><strong>Reported:</strong> {assignment.incident_created_at ? new Date(assignment.incident_created_at).toLocaleString() : "Not available"}</p>
                                  <p><strong>Admin notes:</strong> {assignment.notes || "No additional notes"}</p>
                                  <p><strong>Incident status:</strong> {String(assignment.incident_status || "IN_PROGRESS").replaceAll("_", " ")} · <strong>Responder decision:</strong> {statusLabel}</p>
                                  {Array.isArray(assignment.images) && assignment.images.length > 0 && (
                                    <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 10, marginBottom: 12 }}>
                                      {assignment.images.map((photo) => (
                                        <a key={photo.id} href={photo.image_url} target="_blank" rel="noreferrer" title="Open incident photo">
                                          <img src={photo.image_url} alt={`Incident ${assignment.incident_id}`} style={{ width: 150, height: 110, objectFit: "cover", borderRadius: 8, border: "1px solid #d7dee8" }} />
                                        </a>
                                      ))}
                                    </div>
                                  )}
                                  {status === "ASSIGNED" && (
                                    <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 12 }}>
                                      <button type="button" className="button button-primary" disabled={loading} onClick={() => handleAssignmentResponse(assignment.id, "ACCEPTED")}>Accept</button>
                                      <button type="button" className="button button-outline" disabled={loading} onClick={() => handleAssignmentResponse(assignment.id, "DECLINED")}>Reject</button>
                                    </div>
                                  )}
                                  {status === "ACCEPTED" && <span className="button button-primary" style={{ display: "inline-block", marginTop: 8, cursor: "default" }}>Accepted ✓</span>}
                                  {status === "DECLINED" && <span className="button button-outline" style={{ display: "inline-block", marginTop: 8, color: "#dc2626", borderColor: "#dc2626", cursor: "default" }}>Rejected ✕</span>}
                                </div>
                                <span className="incident-id">#{assignment.incident_id}</span>
                              </article>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  )}

                  {isAdmin && (
                    <div className="dashboard-panel" style={{ marginTop: 20 }}>
                      <div className="panel-heading">
                        <div>
                          <h2>Incident hotspot summary</h2>
                          <p>Locations with two or more reports at approximately the same coordinates.</p>
                        </div>
                      </div>
                      {(() => {
                        const hotspots = incidents.reduce((groups, incident) => {
                          const lat = Number(incident.latitude);
                          const lng = Number(incident.longitude);
                          if (!Number.isFinite(lat) || !Number.isFinite(lng)) return groups;
                          const key = `${lat.toFixed(3)},${lng.toFixed(3)}`;
                          if (!groups[key]) groups[key] = { key, latitude: lat, longitude: lng, count: 0 };
                          groups[key].count += 1;
                          return groups;
                        }, {});
                        const rows = Object.values(hotspots).filter((item) => item.count >= 2).sort((a, b) => b.count - a.count);
                        return rows.length ? (
                          <div className="incident-list">
                            {rows.map((item) => (
                              <article className="incident-item" key={item.key}>
                                <div className="incident-item-icon">📍</div>
                                <div className="incident-item-content">
                                  <h3>{item.count} reports near one location</h3>
                                  <p>Latitude {item.latitude.toFixed(5)}, longitude {item.longitude.toFixed(5)}</p>
                                </div>
                              </article>
                            ))}
                          </div>
                        ) : <p>No repeated incident locations detected yet.</p>;
                      })()}
                    </div>
                  )}

                  {!isAdmin && !isResponder && (
                  <div className="dashboard-panel" style={{ marginTop: 20 }}>
                    <div className="panel-heading">
                      <div>
                        <h2>Emergency contacts — Sri Lanka</h2>
                        <p>If someone is in immediate danger, contact the appropriate emergency service.</p>
                      </div>
                    </div>
                    <div className="stats-grid">
                      <article className="stat-card">
                        <span className="stat-icon">🚓</span>
                        <span className="stat-label">Police Emergency</span>
                        <strong><a href="tel:119">119</a></strong>
                      </article>
                      <article className="stat-card">
                        <span className="stat-icon">🚑</span>
                        <span className="stat-label">Suwa Seriya Ambulance</span>
                        <strong><a href="tel:1990">1990</a></strong>
                      </article>
                      <article className="stat-card">
                        <span className="stat-icon">🚒</span>
                        <span className="stat-label">Fire & Rescue</span>
                        <strong><a href="tel:110">110</a></strong>
                      </article>
                    </div>
                  </div>
                  )}
                </>
              );
            })()}
          </section>
        )}

        {page === "report" && (
          <section className="report-page">
            <div className="report-intro">
              <span className="eyebrow">HELP KEEP ROADS SAFE</span>
              <h1>Report an incident</h1>
              <p>
                Select the location on the map and provide incident details.
              </p>
            </div>

            <form
              className="form-card report-form"
              onSubmit={handleIncidentSubmit}
            >
              <h2>Incident details</h2>

              <label htmlFor="incident-type">Incident type</label>
              <select
                id="incident-type"
                value={incidentForm.incident_type_id}
                onChange={(event) =>
                  updateIncident("incident_type_id", event.target.value)
                }
                required
              >
                <option value="">Select incident type</option>
                {incidentTypes.map((type) => (
                  <option key={type.id} value={type.id}>
                    {type.name.replaceAll("_", " ")}
                  </option>
                ))}
              </select>

              <label htmlFor="incident-title">Incident title</label>
              <input
                id="incident-title"
                value={incidentForm.title}
                onChange={(event) =>
                  updateIncident("title", event.target.value)
                }
                placeholder="e.g. Vehicle accident on main road"
                required
              />

              <label htmlFor="incident-description">Description</label>
              <textarea
                id="incident-description"
                rows={4}
                value={incidentForm.description}
                onChange={(event) =>
                  updateIncident("description", event.target.value)
                }
                placeholder="Describe what happened..."
                required
              />

              <label htmlFor="incident-severity">Severity</label>
              <select
                id="incident-severity"
                value={incidentForm.severity}
                onChange={(event) =>
                  updateIncident("severity", event.target.value)
                }
              >
                <option value="LOW">Low</option>
                <option value="MEDIUM">Medium</option>
                <option value="HIGH">High</option>
                <option value="CRITICAL">Critical</option>
              </select>

              <h3>Choose incident location</h3>
              <p className="location-help">
                Click anywhere on the map to place the marker.
              </p>

              <div className="incident-map">
                <MapContainer
                  center={[6.9271, 79.8612]}
                  zoom={12}
                  scrollWheelZoom
                  style={{ height: "360px", width: "100%" }}
                >
                  <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  />
                  <LocationPicker
                    position={selectedPosition}
                    onLocationSelect={(location) => {
                      setIncidentForm((previous) => ({
                        ...previous,
                        latitude: location.latitude,
                        longitude: location.longitude,
                      }));
                    }}
                  />
                </MapContainer>
              </div>

              <div className="form-row">
                <div>
                  <label htmlFor="incident-latitude">Latitude</label>
                  <input
                    id="incident-latitude"
                    type="number"
                    step="any"
                    min="-90"
                    max="90"
                    value={incidentForm.latitude}
                    onChange={(event) =>
                      updateIncident("latitude", event.target.value)
                    }
                    required
                  />
                </div>
                <div>
                  <label htmlFor="incident-longitude">Longitude</label>
                  <input
                    id="incident-longitude"
                    type="number"
                    step="any"
                    min="-180"
                    max="180"
                    value={incidentForm.longitude}
                    onChange={(event) =>
                      updateIncident("longitude", event.target.value)
                    }
                    required
                  />
                </div>
              </div>

              <label htmlFor="incident-address">Address or landmark</label>
              <input
                id="incident-address"
                value={incidentForm.address}
                onChange={(event) =>
                  updateIncident("address", event.target.value)
                }
                placeholder="Street, town, or nearby landmark"
                required
              />

              <button
                className="button button-primary button-full"
                type="submit"
                disabled={loading}
              >
                {loading ? "Submitting report..." : "Submit Incident Report"}
              </button>

              <button
                type="button"
                className="back-home"
                onClick={() => navigate("dashboard")}
              >
                ← Back to dashboard
              </button>
            </form>
          </section>
        )}
      </main>

      {!isStaffDashboardOnly && (
        <footer className="site-footer">
          <button className="footer-brand" onClick={() => navigate(user ? "dashboard" : "home")}>
            🛡️ SafeRoute
          </button>
          <p>Building safer roads through connected communities.</p>
          <span>© {new Date().getFullYear()} SafeRoute</span>
        </footer>
      )}
    </div>
  );
}

export default App;






