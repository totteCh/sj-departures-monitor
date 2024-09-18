import Pushover from 'pushover-notifications'
import { promisify } from 'util'

const userKey = process.env.PUSHOVER_USER_KEY
const token = process.env.PUSHOVER_TOKEN

if (!userKey || !token) {
  console.error('Invalid Pushover configuration!')
  process.exit(1)
}

const pushover = new Pushover({
  user: userKey,
  token: token,
})

export async function sendNotification(
  message: string,
  title: string = 'Notification',
) {
  try {
    const sendAsync = promisify(pushover.send)
    await sendAsync({ message, title })
    console.log('Pushover notification sent.')
  } catch (error) {
    console.error('Error sending Pushover notification:', error)
    throw error
  }
}
