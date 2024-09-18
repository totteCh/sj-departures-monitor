import axios from 'axios'
import { config } from 'dotenv'
import * as cron from 'node-cron'

config()

import { sendNotification } from './pushover'

// Search configuration
const fromStation = process.env.FROM_STATION
const toStation = process.env.TO_STATION
const departureDate = process.env.DEPARTURE_DATE

if (!fromStation || !toStation || !departureDate) {
  console.error('Invalid search configuration!')
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

// Schedule a task to check departures every hour
cron.schedule('0 5-20 * * *', async () => {
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
