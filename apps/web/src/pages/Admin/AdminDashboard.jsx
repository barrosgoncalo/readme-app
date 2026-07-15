import React, { useState, useEffect } from "react";
import { getFirestore, collection, getDocs, query, limit } from "firebase/firestore";
import { getAuth, signOut } from "firebase/auth";

// 1. Import your new service (adjust the path to match your project structure)
import { alterUserPrivileges } from "@readme/shared/src/services/admin";

export default function AdminDashboard() {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(null);

    const db = getFirestore();
    const auth = getAuth();

    useEffect(() => {
        const fetchUsers = async () => {
            try {
                const q = query(collection(db, "users"), limit(50));
                const querySnapshot = await getDocs(q);
                const usersList = querySnapshot.docs.map(doc => ({
                    uid: doc.id,
                    ...doc.data()
                }));
                setUsers(usersList);
            } catch (error) {
                console.error("Error fetching users list:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchUsers();
    }, [db]);

    const handleRoleChange = async (targetUid, currentRole) => {
        const makeAdmin = currentRole !== "admin";
        const confirmMessage = makeAdmin 
            ? "Are you sure you want to promote this user to Admin?" 
            : "Are you sure you want to demote this Admin back to a regular User?";

        if (!window.confirm(confirmMessage)) return;

        setActionLoading(targetUid);

        try {
            // 2. Call the service instead of raw Firebase functions
            const data = await alterUserPrivileges(targetUid, makeAdmin);

            if (data.success) {
                setUsers(prevUsers => 
                    prevUsers.map(u => 
                        u.uid === targetUid ? { ...u, role: makeAdmin ? "admin" : "user" } : u
                    )
                );
                alert(data.message);
            }
        } catch (error) {
            console.error("Failed to alter user privileges:", error);
            alert(error.message || "A secure execution error occurred during promotion.");
        } finally {
            setActionLoading(null);
        }
    };

    const handleLogout = () => signOut(auth);

    if (loading) {
        return (
            <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100vh", backgroundColor: "#121212", color: "#fff", fontFamily: "sans-serif" }}>
                <p>Loading administrative dashboard...</p>
            </div>
        );
    }

    return (
        <div style={{ padding: "40px 20px", maxWidth: "900px", margin: "0 auto", color: "#212529", fontFamily: "sans-serif" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <h2 style={{ margin: 0, fontWeight: "bold" }}>🛡️ Admin Role Manager</h2>
                <button 
                    onClick={handleLogout}
                    style={{ padding: "10px 18px", backgroundColor: "#dc3545", color: "#fff", border: "none", borderRadius: "4px", cursor: "pointer", fontWeight: 'bold' }}
                >
                    Logout
                </button>
            </div>
            <hr style={{ margin: "25px 0", borderColor: "#e9ecef" }} />
            
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                    <tr style={{ textAlign: "left", borderBottom: "2px solid #dee2e6" }}>
                        <th style={{ padding: "12px", color: "#495057" }}>User Name</th>
                        <th style={{ padding: "12px", color: "#495057" }}>Email Identifier</th>
                        <th style={{ padding: "12px", color: "#495057" }}>Current Role</th>
                        <th style={{ padding: "12px", color: "#495057" }}>Action</th>
                    </tr>
                </thead>
                <tbody>
                    {users.map(user => (
                        <tr key={user.uid} style={{ borderBottom: "1px solid #f1f3f5" }}>
                            <td style={{ padding: "14px 12px", fontWeight: "500" }}>{user.fullName || user.username || "Unnamed User"}</td>
                            <td style={{ padding: "14px 12px", color: "#6c757d" }}>{user.email || user.userId || "No Email Associated"}</td>
                            <td style={{ padding: "14px 12px" }}>
                                <span style={{
                                    padding: "4px 8px",
                                    borderRadius: "4px",
                                    fontSize: "12px",
                                    backgroundColor: user.role === "admin" ? "#d4edda" : "#f1f3f5",
                                    color: user.role === "admin" ? "#155724" : "#495057",
                                    fontWeight: "bold"
                                }}>
                                    {user.role || "user"}
                                </span>
                            </td>
                            <td style={{ padding: "14px 12px" }}>
                                {user.uid === auth.currentUser?.uid ? (
                                    <span style={{ color: "#868e96", fontStyle: "italic", fontSize: "14px" }}>You (Active Session)</span>
                                ) : (
                                    <button
                                        disabled={actionLoading !== null}
                                        onClick={() => handleRoleChange(user.uid, user.role)}
                                        style={{
                                            padding: "6px 14px",
                                            backgroundColor: user.role === "admin" ? "#dc3545" : "#007bff",
                                            color: "white",
                                            border: "none",
                                            borderRadius: "4px",
                                            cursor: "pointer",
                                            opacity: actionLoading ? 0.6 : 1,
                                            fontWeight: "500"
                                        }}
                                    >
                                        {actionLoading === user.uid ? "Executing..." : user.role === "admin" ? "Demote" : "Promote"}
                                    </button>
                                )}
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}
