import axios from "axios";
import { Badge } from "react-bootstrap"; // Or your UI library
import React, { useState } from "react";

const SampleStatusCell = ({ test, sidNumber, token }) => {
  const [status, setStatus] = useState(test.sample_received ? "Received" : "Not Received");

  const handleChange = async (e) => {
    const newStatus = e.target.value;
    const sample_received = newStatus === "Received";

    try {
      await axios.put(
        `/api/billing-reports/sid/${sidNumber}/test/${test.id}/sample-status`,
        { sample_received },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );
      setStatus(newStatus);
    } catch (error) {
      console.error("Failed to update sample status", error);
      alert("Error updating status");
    }
  };

  const badgeColor =
    test.status === "Completed"
      ? "success"
      : test.status === "In Progress"
      ? "warning"
      : test.status === "Pending"
      ? "secondary"
      : "primary";

  return (
   ""
  );
};


export default SampleStatusCell