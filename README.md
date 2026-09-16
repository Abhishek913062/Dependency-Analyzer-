# AI Dependency Risk Analyzer

An AI-powered developer tool that analyzes project dependencies, identifies **security risks, outdated packages, version conflicts, and dependency issues**, and provides intelligent upgrade recommendations.

## 🚀 Features

* 🔍 **Dependency Scanning** – Analyze dependency files such as `package.json` and `pom.xml`.
* 🛡️ **Risk Detection** – Identify outdated or potentially vulnerable dependencies.
* ⚠️ **Conflict Detection** – Detect dependency version conflicts and compatibility issues.
* 🤖 **AI-Powered Analysis** – Use Gemini AI to analyze dependency risks and explain their impact.
* 💡 **Upgrade Recommendations** – Generate suggestions for safer and more compatible dependency versions.
* 📊 **Risk Dashboard** – Present dependency risks and analysis results in an easy-to-understand interface.
* 📄 **Multiple Manifest Support** – Designed to support dependency formats used by different development ecosystems.

## 🛠️ Tech Stack

| Category         | Technology                |
| ---------------- | ------------------------- |
| Frontend         | React                     |
| Backend          | Node.js, Express.js       |
| Language         | JavaScript                |
| AI               | Google Gemini API         |
| API              | REST APIs                 |
| Package Analysis | `package.json`, `pom.xml` |
| Version Control  | Git, GitHub               |

## 🏗️ Architecture

```text
┌─────────────────────────────────────────┐
│              React Frontend             │
│                                         │
│  Upload / Input Dependency Manifest     │
│  Risk Dashboard │ Recommendations       │
└───────────────────┬─────────────────────┘
                    │
                    ▼
┌─────────────────────────────────────────┐
│          Node.js + Express API          │
│                                         │
│  Dependency Parser │ Risk Analyzer      │
│  Version Checker   │ AI Service         │
└───────────────┬───────────────┬─────────┘
                │               │
                ▼               ▼
        Dependency Data     Gemini AI
                │               │
                └───────┬───────┘
                        ▼
              Risk & Upgrade Report
```

## 📁 Project Structure

```text
AI-Dependency-Risk-Analyzer/
│
├── client/
│   ├── src/
│   ├── components/
│   └── pages/
│
├── server/
│   ├── routes/
│   ├── controllers/
│   ├── services/
│   └── utils/
│
├── .env
├── package.json
└── README.md
```

> The exact folder structure may vary depending on the implementation.

## ⚙️ Getting Started

### 1. Clone the Repository

```bash
git clone https://github.com/YOUR-USERNAME/YOUR-REPOSITORY.git
cd YOUR-REPOSITORY
```

### 2. Install Dependencies

Install backend dependencies:

```bash
cd server
npm install
```

Install frontend dependencies:

```bash
cd ../client
npm install
```

### 3. Configure Environment Variables

Create a `.env` file in the backend directory:

```env
GEMINI_API_KEY=your_gemini_api_key
PORT=5000
```

**Never commit your `.env` file or expose API keys in the repository.**

Make sure `.env` is included in `.gitignore`:

```text
.env
.env.local
node_modules/
```

### 4. Start the Backend

```bash
cd server
npm start
```

### 5. Start the Frontend

In another terminal:

```bash
cd client
npm run dev
```

Open the application in your browser using the URL displayed by the development server.

## 🔄 How It Works

```text
Dependency File
      ↓
Dependency Parser
      ↓
Extract Package Information
      ↓
Version & Risk Analysis
      ↓
Gemini AI Analysis
      ↓
Risk Classification
      ↓
Upgrade Recommendations
      ↓
Interactive Dashboard
```

The application extracts dependency information from supported project manifests and analyzes package versions, potential risks, and conflicts. Gemini AI is then used to provide explanations and actionable upgrade recommendations.

## 🛡️ Risk Analysis

The analyzer can evaluate dependencies based on factors such as:

* Outdated package versions
* Potential security vulnerabilities
* Version conflicts
* Dependency compatibility
* Major-version upgrade risks
* Recommended upgrade paths

> AI-generated recommendations should be validated against official package documentation and security advisories before applying changes to production systems.

## 🎯 Use Cases

* Quickly audit project dependencies.
* Identify outdated packages.
* Understand potential dependency risks.
* Detect version conflicts.
* Get AI-assisted upgrade recommendations.
* Help developers maintain healthier dependency ecosystems.

## 🚧 Future Improvements

* Support for additional ecosystems such as Python, Go, and .NET.
* Integration with vulnerability databases such as OSV and GitHub Advisory Database.
* Automated dependency update pull requests.
* Dependency graph visualization.
* CI/CD integration for automated dependency checks.
* Continuous monitoring of newly disclosed vulnerabilities.
* Automated severity scoring and prioritization.

## 👨‍💻 Author

**Abhishek Mahajan**

B.Tech – Computer Science & Engineering (AI & Data Science)
MIT World Peace University, Pune

---

⭐ If you find this project useful, consider giving the repository a star!
