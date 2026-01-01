import React from "react";

const PositiveState = ({ message }) => (
    <div className="text-center text-success p-3">
        <i className="nc-icon nc-check-2" style={{ fontSize: '1.5rem' }}></i>
        <p className="mt-2 mb-0" style={{ fontSize: '0.9rem' }}>{message}</p>
    </div>
);

export default PositiveState;
