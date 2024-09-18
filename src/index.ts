import axios from 'axios'
import { config } from 'dotenv'
import * as cron from 'node-cron'
import Pushover from 'pushover-notifications'

config()

// Search configuration
const fromStation = process.env.FROM_STATION
const toStation = process.env.TO_STATION
const departureDate = process.env.DEPARTURE_DATE

if (!fromStation || !toStation || !departureDate) {
  console.error('Invalid search configuration!')
  process.exit(1)
}

// Pushover configuration
const pushoverUserKey = process.env.PUSHOVER_USER_KEY
const pushoverToken = process.env.PUSHOVER_TOKEN
const pushover = new Pushover({
  user: pushoverUserKey,
  token: pushoverToken,
})

if (!pushoverUserKey || !pushoverToken) {
  console.error('Invalid Pushover configuration!')
  process.exit(1)
}

const apiUrl = 'https://prod-api.adp.sj.se/public/sales/booking/v3'
const subscriptionKey = 'd6625619def348d38be070027fd24ff6'
const searchRequestBody = {
  origin: fromStation,
  destination: toStation,
  departureDate,
  passengers: [{ passengerCategory: { type: 'ADULT' } }],
}

let lastDepartureCount = 0

// Function to perform the first search and get the search ID
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

// Function to perform the second search and check departures
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
      sendNotification()
      lastDepartureCount = departures.length
    } else {
      console.log('No new departures found.')
    }
  } catch (error) {
    console.error('Error checking departures:', error)
  }
}

// Function to send a Pushover notification
function sendNotification() {
  const message = {
    message: `New departures found for ${departureDate}.`,
    title: 'SJ Departures Available',
  }

  try {
    pushover.send(message)
    console.log('Pushover notification sent.')
  } catch (error) {
    console.error('Error sending Pushover notification:', error)
  }
}

// Schedule a task to check departures every hour
cron.schedule('0 5-20 * * *', async () => {
  console.log('Checking for new departures...')

  const searchId = await performSearch()

  if (searchId) {
    await checkDepartures(searchId)
  }
})

// Initial call to start
;(async function () {
  const searchId = await performSearch()

  if (searchId) {
    await checkDepartures(searchId)
  }
})()
