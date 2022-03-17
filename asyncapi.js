import { google } from 'googleapis'

/**
 * Service accounts keys to be generated. The service account needs to have access to the calendar.
 * The calendar ID should be in the environment variable.
 */
const auth = new google.auth.GoogleAuth({
    keyFile: './service-account.json',
    scopes: ['https://www.googleapis.com/auth/calendar'],
});

const calendar = google.calendar({version: 'v3', auth});

/**
 * In google calendar, there are 2 types of events: single-ocurring and recurring.
 * Instances of recurring events can be converted to single-ocurring by individually updating them.
 * All events are being linked to their GitHub issues. Recurring event instances get linked to their 
 * issues using updateInstance.
 */

/**
 * Adds new single-occuring event
 * @param {String} title Title of the event
 * @param {String} description Description of the event
 * @param {String} zoomUrl Zoom url of the meeting
 * @param {String} startTime RFC3339 starting time
 * @param {String} endTime RFC3339 ending time
 * @param {Number} issueNumber GitHub issue number of the event, to find event later
 */
async function addEvent(title, description, zoomUrl, startTime, endTime, issueNumber) {
    await calendar.events.insert({
        calendarId: process.env.CALENDAR_ID,
        requestBody: {
            summary: title,
            description: `${description}<br><b>Zoom</b>: <a href="${zoomUrl}">Meeting Link</a><br><b>Agenda</b>: <a href="${issueNumber}">Issue Link</a>`,
            start: {
                dateTime: startTime
            },
            end: {
                dateTime: endTime
            },
            location: zoomUrl,
            extendedProperties: {
                private: {
                    'ISSUE_ID': `${issueNumber}`
                }
            }
        }
    })
    console.log('Event created')
}

/**
 * Deletes a single-occuring event from issue number
 * @param {Number} issueNumber GitHub issue number of the meeting to delete
 */
async function deleteEvent(issueNumber) {
    let events = (await calendar.events.list({
        calendarId: process.env.CALENDAR_ID,
        privateExtendedProperty: `ISSUE_ID=${issueNumber}`
    })).data.items
    
    if ( events.length > 0 ) {
        await calendar.events.delete({
            calendarId: process.env.CALENDAR_ID,
            eventId: events[0].id
        })
        console.log('Event deleted from calendar')
    } else {
        console.log('Event not found in calendar')
    }
}

/**
 * Lists all events including single-occuring and recurring
 */
async function listEvents() {
    return (await calendar.events.list({
        calendarId: process.env.CALENDAR_ID,
        privateExtendedProperty: "RECURRENCE=TRUE"
    })).data
}

/**
 * Lists all instances of a recurring event that are yet to end
 * @param {String} eventId ID of a recurring event
 * @returns 
 */
async function listInstances(eventId) {
    return ((await calendar.events.instances({
        calendarId: process.env.CALENDAR_ID,
        eventId,
        timeMin: new Date().toISOString()
    })).data.items)
}

/**
 * Add new recurring event
 * @param {String} title Title of the event
 * @param {String} description Description of the event
 * @param {String} zoomUrl Zoom url of the meeting
 * @param {String} startTime RFC3339 starting time
 * @param {String} endTime RFC3339 ending time
 * @param {Number} issueNumber GitHub issue number of the event, to find event later
 * @param {String} recurrence Recurrence rule as specified in RFC5545
 */
async function addRecurringEvent(title, description, zoomUrl, startTime, endTime, recurrence) {
    await calendar.events.insert({
        calendarId: process.env.CALENDAR_ID,
        requestBody: {
            summary: title,
            description: `${description}<br><b>Zoom</b>: <a href="${zoomUrl}">Meeting Link</a><br><b>Agenda</b>: NA`,
            start: {
                dateTime: startTime,
                timeZone: 'Asia/Kolkata' // Time zone for recurrence to be expanded in
            },
            end: {
                dateTime: endTime,
                timeZone: 'Asia/Kolkata' // Time zone for recurrence to be expanded in
            },
            recurrence: [
                recurrence // can be multiple recurrence rules
            ],
            location: zoomUrl,
            extendedProperties: {
                private: {
                    'RECURRENCE': 'TRUE'
                }
            }
        }
    })
    console.log('Event created')
}

/**
 * Add an GitHub issue number to an instance of recurring event.
 * Updating a single instance of a recurring event converts it into a single-ocurring event.
 * @param {String} instance Instance ID of event
 * @param {Number} issueNumber GitHub issue number to link to
 */
async function updateInstance(instance, issueNumber) {
    instance.extendedProperties.private['ISSUE_ID'] = `${issueNumber}`
    console.log((await calendar.events.update({
        eventId: instance.id,
        calendarId: process.env.CALENDAR_ID,
        requestBody: instance
    })).data)
}

(async () => {
    //await addRecurringEvent('Test Recurring meeting', 'This meeting is for testing purposes.', 'https://zoom.com', '2022-02-06T18:00:00+05:30', '2022-02-06T19:00:00+05:30', 'RRULE:FREQ=WEEKLY;COUNT=4')
    // await deleteEvent(1)
    // let instance = (await listInstances('p1edvsmdvsmt6ouei2a04v8qio'))[0]
    // await updateInstance(instance, 1)
})()