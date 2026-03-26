import { useState, useEffect } from "react";

function SearchPage() {
    const [services, setServices] = useState([]);
    const [query, setQuery] = useState("");


    // CHANGE THE FETCH ADDRESS TO WHAT IS NEEDED
    useEffect(() => {
        fetch("http://127.0.0.1:8000/services/")
        .then(res => res.json())
        .then(data => setServices(data));
    }, []);

    const filteredServices = services.filter(service => service.title?.toLowerCase().includes(query.toLowerCase()));

    return (
    <div>
      <h1>Search Services</h1>

      <input
        type="text"
        placeholder="Search Services"
        style={{ width: '100%', padding: '8px', marginBottom: '16px', boxSizing: 'border-box', border: '1px solid #ccc', borderRadius: '4px' }}
        onChange={(i) => setQuery(i.target.value)}
      />

      {filteredServices.map(service => (
        <div key={service.id} style={{ marginBottom: "16px" }}>
          <h3>{service.title}</h3>
          <p>{service.description}</p>
        </div>
      ))}
      {filteredServices.length === 0 && <p>No services found</p>}
    </div>
  );
}

export default SearchPage;
