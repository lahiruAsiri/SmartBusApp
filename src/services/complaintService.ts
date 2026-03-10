import { auth } from "../api/firebase";

const API_BASE_URL = "http://10.54.14.76:5000/api";

export interface Complaint {
  id: string;
  passengerId: string;
  busId: string;
  driverId: string;
  routeId: string;
  complaintText: string;
  complaintCategory: string;
  timestamp: string;
  status: "Pending" | "In Progress" | "Resolved";
  resolutionMessage?: string;
  resolvedAt?: string;
  resolutionFeedback?: "like" | "dislike" | null;
}

export const submitComplaint = async (data: {
  busId: string;
  complaintText: string;
  incidentTime: Date;
  tripId?: string;
}) => {
  const user = auth.currentUser;
  if (!user) throw new Error("User not authenticated");

  const token = await user.getIdToken();

  const response = await fetch(`${API_BASE_URL}/complaints`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      ...data,
      passengerId: user.uid,
    }),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || "Failed to submit complaint");
  }

  return await response.json();
};

export const getUserComplaints = async (passengerId: string) => {
  const user = auth.currentUser;
  let headers: Record<string, string> = {};

  if (user) {
    const token = await user.getIdToken();
    headers["Authorization"] = `Bearer ${token}`;
  }

  const response = await fetch(
    `${API_BASE_URL}/complaints?passengerId=${passengerId}`,
    {
      method: "GET",
      headers: headers,
    },
  );

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || "Failed to fetch complaints");
  }

  return (await response.json()) as Complaint[];
};

export const updateComplaintFeedback = async (
  complaintId: string,
  feedback: "like" | "dislike",
) => {
  const response = await fetch(
    `${API_BASE_URL}/complaints/${complaintId}/feedback`,
    {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ feedback }),
    },
  );

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || "Failed to update feedback");
  }

  return await response.json();
};

export const fetchBusesForComplaint = async () => {
  const user = auth.currentUser;
  let headers: Record<string, string> = {};

  if (user) {
    const token = await user.getIdToken();
    headers["Authorization"] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE_URL}/buses`, {
    method: "GET",
    headers: headers,
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || "Failed to fetch buses");
  }

  return await response.json();
};
