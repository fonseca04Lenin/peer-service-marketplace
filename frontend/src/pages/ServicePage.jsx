import { useState, useEffect } from "react";

function ServicePage( {id} ) {
    const [service, setService] = useState(null);

    // CHANGE THE FETCH ADDRESS TO WHAT IS NEEDED
    useEffect(() => {
        fetch(`http://127.0.0.1:8000/api/services/${id}/`)
        .then(res => res.json())
        .then(data => setService(data));
    }, [id]);

    if (!service) return <p>Loading</p>

    return (
        <div>
            <h1>{service.title}</h1>
            <p>{service.description}</p>
            <p>Category: {service.category}</p>
            <p>Price: ${service.price}</p>
            <p>Provider: ${service.provider}</p>
        </div>
    );
}

export default ServicePage;