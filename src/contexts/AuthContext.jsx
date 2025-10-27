import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext(undefined);

export const AuthProvider = ({ children }) => {
   const [user, setUser] = useState(null);
   const [studentComposite, setStudentComposite] = useState(null); // { student, room, hostel }
   const [token, setToken] = useState(() => {
     try {
       return localStorage.getItem('authToken');
     } catch (e) {
       return null;
     }
   });
   const [isInitializing, setIsInitializing] = useState(true);
   // backend auth base URL (development: runs on localhost:4004)
   const AUTH_BASE = 'http://localhost:4004/auth';
   // student service base (development: runs on localhost:4000)
   const STUDENT_BASE = 'http://localhost:4000';

   // Helper to ensure a user object always has a role to avoid redirects to /undefined
   const withDefaultRole = (u) => {
     if (!u) return u;
     try {
       if (typeof u.role === 'string' && u.role.trim().length > 0) return u;
       return { ...u, role: 'STUDENT' };
     } catch (e) {
       return { ...u, role: 'STUDENT' };
     }
   };

   // Helper to fetch the composite /students/me/full and update state
   const refreshUserComposite = async () => {
     const currentToken = token ?? (() => { try { return localStorage.getItem('authToken'); } catch (e) { return null; } })();
     if (!currentToken) return { success: false, message: 'No token' };
     try {
       const res = await fetch(`${STUDENT_BASE}/students/me/full`, {
         method: 'GET',
         headers: { Authorization: `Bearer ${currentToken}` },
       });
       if (!res.ok) {
         return { success: false, message: `HTTP ${res.status}` };
       }
       const composite = await res.json();
       // composite expected { student, room, hostel }
       setStudentComposite(composite);
       if (composite?.student) {
         // ensure the student object has a role so UI routing/guards work
         const studentWithRole = { ...composite.student };
         if (!studentWithRole.role) studentWithRole.role = 'STUDENT';
         setUser(withDefaultRole(studentWithRole));
       }
       return { success: true, composite };
     } catch (err) {
       return { success: false, message: err?.message ?? 'Network error' };
     }
   };

   useEffect(() => {
     // On mount, if token exists try to load the composite so the app has user info
     const tryLoad = async () => {
       try {
         if (token && !studentComposite) {
           await refreshUserComposite();
         }
       } catch (e) {
         // ignore
       } finally {
         // mark initialization finished regardless of success/failure
         setIsInitializing(false);
       }
     };
     tryLoad();
     // eslint-disable-next-line react-hooks/exhaustive-deps
   }, []);

  /**
   * Login with email & password. Returns { success, user?, message? }.
   */
   const login = async (email, password) => {
     try {
       const res = await fetch(`${AUTH_BASE}/login`, {
         method: 'POST',
         headers: { 'Content-Type': 'application/json' },
         body: JSON.stringify({ email, password }),
       });

       let data = null;
       try {
         data = await res.json();
       } catch (e) {
         // ignore parse errors
       }

       if (!res.ok) {
         return { success: false, message: data?.message ?? `HTTP ${res.status}` };
       }

       // Normalize the login response into a `user`-like object expected by the app.
       // The auth-service returns { token, role, email } (no nested `user`),
       // while older frontend expectations were { user: { ... } }.
       let userFromServer;
      if (data?.user) {
        userFromServer = data?.user;
      } else if (data?.role || data?.email) {
        userFromServer = { email: data?.email, role: data?.role };
      } else if (data) {
        // fallback to using whatever was returned
        userFromServer = data;
      } else {
        userFromServer = { email };
      }

       // store token if provided
       if (data?.token) {
         try {
           localStorage.setItem('authToken', data?.token);
           setToken(data?.token);
         } catch (e) {
           // ignore
         }
       }

       // Try to fetch full student composite from student-service
       let finalUser = userFromServer;
       try {
         let profileToken = token;
         if (!profileToken) {
           try { profileToken = data?.token || localStorage.getItem('authToken'); } catch (e) { profileToken = data?.token ?? null; }
         }
         if (profileToken) {
           const profileRes = await fetch(`${STUDENT_BASE}/students/me/full`, {
             method: 'GET',
             headers: { Authorization: `Bearer ${profileToken}` },
           });
           if (profileRes.ok) {
             const profileJson = await profileRes.json();
             // profileJson = { student, room, hostel }
             if (profileJson?.student) {
               finalUser = profileJson.student;
               // ensure a role exists: prefer auth-service role, otherwise default to STUDENT
               if (!finalUser.role) {
                 finalUser.role = userFromServer?.role ?? 'STUDENT';
               }
             }
             // store composite but ensure student has a role there too
             if (profileJson?.student && !profileJson.student.role) {
               profileJson.student = { ...profileJson.student, role: userFromServer?.role ?? 'STUDENT' };
             }
             setStudentComposite(profileJson);
           }
         }
       } catch (e) {
         // ignore profile fetch errors; keep minimal user info
       }

       setUser(withDefaultRole(finalUser));
      // try to ensure studentComposite is loaded in background if token set
      if (data?.token) {
        try {
          await refreshUserComposite();
        } catch (e) {
          // ignore
        }
      }

       return { success: true, user: finalUser };
     } catch (err) {
       return { success: false, message: err?.message ?? 'Network error' };
     }
   };

   const logout = () => {
     setUser(null);
     setStudentComposite(null);
     setToken(null);
     try {
       localStorage.removeItem('authToken');
     } catch (e) {
       // ignore
     }
   };

  /**
   * Fetch the user id (UUID) for the currently logged in user by email.
   * Returns { success: boolean, id?: string, message?: string }
   */
   const fetchUserId = async () => {
     const email = user?.email;
     if (!email) {
       return { success: false, message: 'No user email available' };
     }

     try {
       let currentToken = token;
       if (!currentToken) {
         try { currentToken = localStorage.getItem('authToken'); } catch (e) { currentToken = null; }
       }
       const res = await fetch(`${AUTH_BASE}/user/email/${encodeURIComponent(email)}`, {
         method: 'GET',
         headers: currentToken ? { Authorization: `Bearer ${currentToken}` } : undefined,
       });

       if (!res.ok) {
         return { success: false, message: `HTTP ${res.status}` };
       }

       const id = await res.text();
       try {
         const parsed = JSON.parse(id);
         if (typeof parsed === 'string') return { success: true, id: parsed };
         if (parsed?.id) return { success: true, id: parsed.id };
       } catch (e) {
         // not JSON, continue
       }

       return { success: true, id: id };
     } catch (err) {
       return { success: false, message: err?.message ?? 'Network error' };
     }
   };

   return (
     <AuthContext.Provider value={{ user, studentComposite, token, isInitializing, login, logout, fetchUserId, refreshUserComposite }}>
       {children}
     </AuthContext.Provider>
   );
};

export const useAuth = () => {
   const context = useContext(AuthContext);
   if (context === undefined) {
     throw new Error('useAuth must be used within an AuthProvider');
   }
   return context;
};
