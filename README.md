# 🌦️ WeatherWear – Your Weather, Your Style

WeatherWear is an AI-powered weather-based clothing recommendation platform that helps users decide what to wear based on real-time weather conditions and forecasts.

It combines live weather information, AI-generated outfit suggestions, and real product discovery to make everyday clothing decisions easier.

🌐 **Live Website:** https://weatherwear.ddns.net  
📦 **GitHub Repository:** https://github.com/Rizwana200/WeatherWear

---

## ✨ Features

### 🌤️ Real-Time Weather Dashboard
- Detects the user's current location.
- Search and select different cities.
- Displays temperature, feels-like temperature, humidity, precipitation, and wind speed.
- Provides weather conditions and forecast information.
- Displays a 3-day weather forecast.

### 👗 AI-Powered Outfit Recommendations
- Generates clothing recommendations based on weather conditions.
- Suggests suitable clothing, footwear, and accessories.
- Provides activity suggestions based on the weather.
- Uses DeepSeek AI for intelligent responses.

### 🌍 City Comparison
- Compare weather conditions across multiple cities.
- Add up to five cities.
- View temperature and weather differences.
- Ask AI questions about the compared locations.

### 🛍️ Weather-Based Shopping
- Recommends clothing and footwear based on weather conditions.
- Supports men's and women's fashion.
- Includes tops, shirts, jeans, trousers, jackets, footwear, and accessories.
- Retrieves real product listings through ReefAPI's Meesho integration.
- Provides links to product listings on Meesho.

### 📱 Responsive Interface
- Modern and colorful dashboard.
- Responsive layouts for different screen sizes.
- Separate Home, Compare, and Store sections.

---

## 🛠️ Tech Stack

| Technology | Purpose |
|---|---|
| Next.js | Full-stack React framework |
| React.js | Building interactive UI |
| JavaScript | Application logic |
| Tailwind CSS | Styling and responsive design |
| Open-Meteo API | Real-time weather and forecast data |
| Open-Meteo Geocoding API | City search and location coordinates |
| Photon API | Location search and reverse geocoding |
| DeepSeek AI | AI-powered recommendations and responses |
| ReefAPI | Meesho product search integration |
| Unsplash API | Weather and lifestyle images |
| Docker | Containerization |
| GitHub Actions | CI/CD automation |
| AWS EC2 | Cloud hosting |
| AWS Systems Manager Parameter Store | Secure environment variable storage |
| Nginx | Reverse proxy and HTTPS routing |
| Certbot / Let's Encrypt | SSL certificate management |
| No-IP | Domain name and DNS configuration |

---

## 🏗️ Architecture

```text
                    User
                     |
                     v
              WeatherWear UI
                (Next.js)
                     |
              +------+------+
              |             |
              v             v
           Weather       DeepSeek
            APIs            AI
              |             |
              +------+------+
                     |
                     v
              Weather-Based
              Recommendations
                     |
                     v
               Store Section
                     |
                     v
                  ReefAPI
                     |
                     v
              Meesho Products


             Deployment Pipeline

                  GitHub
                     |
                     v
               GitHub Actions
                     |
                     v
               Docker Build
                     |
                     v
                  GHCR
                     |
                     v
                 AWS EC2
                     |
                     v
                  Nginx
                     |
                     v
              HTTPS Website
```

---

## 📂 Project Structure

```text
WeatherWear/
│
├── app/
│   ├── dashboard/
│   │   ├── page.js
│   │   ├── layout.js
│   │   ├── store/
│   │   │   └── page.js
│   │   └── compare/
│   │
│   ├── api/
│   │   ├── outfit/
│   │   └── history/
│   │
│   ├── layout.js
│   ├── page.js
│   └── globals.css
│
├── components/
│
├── lib/
│
├── public/
│
├── .github/
│   └── workflows/
│       └── ci.yml
│
├── Dockerfile
├── .dockerignore
├── package.json
├── package-lock.json
├── next.config.js
└── README.md
```

The structure above represents the main application areas; additional files may exist in the repository.

---

## ⚙️ Getting Started

### Prerequisites

Install the following:

- Node.js
- npm
- Git

### 1. Clone the Repository

```bash
git clone https://github.com/Rizwana200/WeatherWear.git
```

### 2. Navigate to the Project

```bash
cd WeatherWear
```

### 3. Install Dependencies

```bash
npm install
```

### 4. Configure Environment Variables

Create a `.env.local` file in the project root.

```env
DEEPSEEK_API_KEY=your_deepseek_api_key
REEF_API_KEY=your_reef_api_key
UNSPLASH_ACCESS_KEY=your_unsplash_access_key
```

Replace the placeholder values with your own API credentials.

> **Important:** Never commit `.env.local` or expose API keys in your GitHub repository.

### 5. Run the Development Server

```bash
npm run dev
```

Open:

```text
http://localhost:3000
```

---

## 🌐 APIs Used

### Open-Meteo

Used to retrieve:

- Current weather conditions.
- Temperature and feels-like temperature.
- Humidity and wind speed.
- Precipitation.
- Daily weather forecasts.

Documentation: [https://open-meteo.com/](https://open-meteo.com/)

### Open-Meteo Geocoding

Used to search for cities and retrieve geographical coordinates.

Documentation: [https://open-meteo.com/en/docs/geocoding-api](https://open-meteo.com/en/docs/geocoding-api)

### Photon API

Used for location suggestions and reverse geocoding.

Documentation: [https://photon.komoot.io/](https://photon.komoot.io/)

### DeepSeek API

Used to generate AI-powered weather-related responses and outfit recommendations.

Documentation: [https://api-docs.deepseek.com/](https://api-docs.deepseek.com/)

### ReefAPI

Used to retrieve Meesho product listings for the shopping section.

### Unsplash API

Used to retrieve relevant images.

Documentation: [https://unsplash.com/developers](https://unsplash.com/developers)

---

## 🐳 Docker Setup

WeatherWear can be containerized using Docker.

### Build the Docker Image

```bash
docker build -t weatherwear .
```

### Run the Container

```bash
docker run -d --name weatherwear -p 3000:3000 weatherwear
```

Open:

```text
http://localhost:3000
```

For production, configure the required environment variables securely.

---

## ☁️ AWS Deployment

WeatherWear is deployed on AWS EC2 using Docker.

### Deployment Technologies

- **AWS EC2** – Hosts the application.
- **Docker** – Runs the application in a container.
- **GitHub Actions** – Automates the build and deployment workflow.
- **GitHub Container Registry (GHCR)** – Stores Docker images.
- **AWS Systems Manager Parameter Store** – Stores API credentials securely.
- **Nginx** – Routes HTTPS traffic to the application.
- **Let's Encrypt** – Provides SSL certificates.
- **No-IP** – Provides the application hostname.

### Deployment Workflow

1. Push code changes to the GitHub repository.
2. GitHub Actions starts the CI/CD workflow.
3. The workflow builds the Docker image.
4. The image is pushed to GitHub Container Registry.
5. GitHub Actions connects to AWS using OIDC.
6. The deployment process updates the application on EC2.
7. Docker runs the updated application.
8. Nginx handles incoming HTTPS requests.

### Live Application

[https://weatherwear.ddns.net](https://weatherwear.ddns.net)

---

## 🔒 Security

- API credentials are stored outside the source code.
- Environment variables are used for sensitive configuration.
- AWS Systems Manager Parameter Store is used for server-side secrets.
- GitHub Actions uses AWS OIDC for deployment authentication.
- HTTPS is enabled using Let's Encrypt.

---

## 🚀 Future Improvements

- User authentication and personalized clothing recommendations.
- More detailed weather-based outfit predictions.
- Improved product ranking and filtering.
- Additional weather-based activities.
- More detailed multi-city weather comparisons.
- Enhanced recommendation accuracy using historical weather patterns.

---

## 👩‍💻 Author

**P. Rizwana**

- GitHub: [https://github.com/Rizwana200](https://github.com/Rizwana200)
- LinkedIn: [https://www.linkedin.com/in/rizwana-p-613868372/](https://www.linkedin.com/in/rizwana-p-613868372/)
- LeetCode: [https://leetcode.com/u/ARizwana/](https://leetcode.com/u/ARizwana/)

---

## 📄 License

This project is developed as a personal project.
