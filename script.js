document.getElementById("getWeather").addEventListener("click", function () {
    const city = document.getElementById("cityInput").value;
    const apiKey = "a4292e400f1e69ca8f9715db0f17e6e1"; // Replace with your API key
    const apiUrl = `https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${apiKey}&units=metric`;

    fetch(apiUrl)
        .then(response => {
            if (!response.ok) throw new Error("City not found");
            return response.json();
        })
        .then(data => {
            const weatherIcon = `http://openweathermap.org/img/wn/${data.weather[0].icon}@2x.png`;

            const weather = `
                <p>City: ${data.name}</p>
                <p>Temperature: ${data.main.temp} °C</p>
                <p>Weather: ${data.weather[0].description}</p>
                <img src="${weatherIcon}" alt="Weather Icon">
            `;

            document.getElementById("weatherDisplay").innerHTML = weather;

            // Add dynamic weather background
            const container = document.querySelector('.container');
            container.className = 'container'; // Reset classes
            if (data.weather[0].main.toLowerCase().includes('cloud')) {
                container.classList.add('cloudy');
            } else if (data.weather[0].main.toLowerCase().includes('rain')) {
                container.classList.add('rainy');
            } else if (data.weather[0].main.toLowerCase().includes('clear')) {
                container.classList.add('sunny');
            } else if (data.weather[0].main.toLowerCase().includes('snow')) {
                container.classList.add('snowy');
            } else {
                container.classList.add('default');
            }
        })
        .catch(error => {
            document.getElementById("weatherDisplay").innerHTML = `<p>${error.message}</p>`;
        });
});