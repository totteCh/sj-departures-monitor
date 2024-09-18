import axios from 'axios'
import axiosRetry from 'axios-retry'
import { config } from 'dotenv'
import * as cron from 'node-cron'
import { sendNotification } from './pushover'

config()

// Validate environment variables
function validateEnvVariables() {
  const requiredVars = [
    'FROM_STATION',
    'TO_STATION',
    'DEPARTURE_DATE',
    'SUBSCRIPTION_KEY',
    'PUSHOVER_USER_KEY',
    'PUSHOVER_TOKEN',
  ]
  for (const variable of requiredVars) {
    if (!process.env[variable]) {
      console.error(`Missing required environment variable: ${variable}`)
      process.exit(1)
    }
  }
}

validateEnvVariables()

const fromStation = process.env.FROM_STATION
const toStation = process.env.TO_STATION
const departureDate = process.env.DEPARTURE_DATE
const apiUrl = 'https://prod-api.adp.sj.se/public/sales/booking/v3'
const subscriptionKey = process.env.SUBSCRIPTION_KEY
const cronSchedule = process.env.CRON_SCHEDULE || '0 5-20 * * *'

// Apply retry logic to axios
axiosRetry(axios, { retries: 3, retryDelay: axiosRetry.exponentialDelay })

const searchRequestBody = {
  origin: fromStation,
  destination: toStation,
  departureDate,
  passengers: [{ passengerCategory: { type: 'ADULT' } }],
}

let lastDepartureCount = 0

async function performSearch(): Promise<string | null> {
  try {
    const response = await axios.post(`${apiUrl}/search`, searchRequestBody, {
      headers: {
        'ocp-apim-subscription-key': subscriptionKey,
        'Content-Type': 'application/json',
      },
    })

    return response.data.departureSearchId
  } catch (error) {
    console.error('Error performing search:', error)
    return null
  }
}

async function checkDepartures(searchId: string): Promise<void> {
  try {
    const response = await axios.get(
      `${apiUrl}/departures/search/${searchId}`,
      {
        headers: {
          'ocp-apim-subscription-key': subscriptionKey,
        },
      },
    )

    const travels = response.data.travels[0]
    const departures = travels.departures

    if (departures.length > lastDepartureCount) {
      console.log(`New departures found: ${departures.length}`)
      await sendNotification(
        `New departures found for ${departureDate}.`,
        'SJ Departures Available',
      )
      lastDepartureCount = departures.length
    } else {
      console.log('No new departures found.')
    }
  } catch (error) {
    console.error('Error checking departures:', error)
  }
}

// Schedule a task to check departures
cron.schedule(cronSchedule, async () => {
  console.log('Checking for new departures...')
  const searchId = await performSearch()
  if (searchId) {
    await checkDepartures(searchId)
  }
})

// Initial call
;(async () => {
  const searchId = await performSearch()
  if (searchId) {
    await checkDepartures(searchId)
  }
})()
