# SJ Departures Monitor

This Node.js application monitors train departures from SJ (Swedish Railways) between two stations and sends notifications using Pushover when new departures are available. It regularly checks for departures based on a cron schedule and alerts the user via Pushover.

## Features

- Regularly checks for train departures between a specified origin and destination.
- Sends notifications using Pushover when new departures are available.
- Configurable through environment variables.
- Uses a cron job to perform the search on a regular schedule.
- Error handling and logging for robustness and transparency.

## Requirements

- Node.js (v14.x or higher)
- Pushover account (to receive notifications)
- API subscription key for SJ's public API

## Setup

### 1. Clone the Repository

```bash
git clone https://github.com/your-username/sj-departures-monitor.git
cd sj-departures-monitor
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Create `.env` File

Create a `.env` file in the root directory and fill in the following values:

```env
FROM_STATION=740000002          # The UIC station code for the origin (e.g., Göteborg Central)
TO_STATION=740000308            # The UIC station code for the destination (e.g., Duved station)
DEPARTURE_DATE=2024-12-17       # The date of departure to monitor (YYYY-MM-DD)

PUSHOVER_USER_KEY=your_user_key  # Your Pushover user key
PUSHOVER_TOKEN=your_app_token    # Your Pushover application token

CRON_SCHEDULE=0 5-20 * * *       # Optional: Cron schedule for checking departures (default is every hour from 05:00 to 20:00)
SUBSCRIPTION_KEY=d6625619def348d38be070027fd24ff6  # Your SJ API subscription key
```

- `FROM_STATION`: UIC station code for the origin.
- `TO_STATION`: UIC station code for the destination.
- `DEPARTURE_DATE`: The departure date to monitor in YYYY-MM-DD format.
- `PUSHOVER_USER_KEY`: Your Pushover user key.
- `PUSHOVER_TOKEN`: Your Pushover app token.
- `CRON_SCHEDULE`: (Optional) A cron expression to define how often to check for departures.
- `SUBSCRIPTION_KEY`: Your API subscription key for SJ's API.

### 4. Run the Application

```bash
npm start
```

This will start monitoring train departures and send a Pushover notification when new departures are found.
