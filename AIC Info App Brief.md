# Product Purpose - what problem does this solve? 

I want to create a super duper simple mobile app for my friend who I am helping organise an AI meetup event. Here is the URL with the event information, so scrape this with Firecrawl to get info. 
https://www.meetup.com/ai-meetup-copenhagen-innovators-creators-techies/events/316009297/?eventOrigin=group_events_list

Profiles:
- event organiser (EO)
- event speaker (ES)
- event attendee (EA)

User stories:
- As the EO, I want to be able to post to-the-minute updates for speakers and attendees to be kept informed about any updates or changes so they can get the most out of it, and the event goes smoothly. Updates could include:
	- change of speaker, change of scheduling (time) or location (one of 3 rooms) for a speaker
	- important info or alerts, e.g. 
		- there will be a break in 10 mins
		- next up: '(speaker/topic)'
- As the EO, I want the schedule for open sessions to be frequently updated as new information becomes available.
	- every time the schedule is updated, the person making an update (editor) takes a photo and submits it (where/how?)
	- Agent processes it:
		- OCR to extract info about update
		- proposed update is made to a new draft version of the agenda & displayed back to editor for confirmation
			- if any corrections required, the editor will enter the corrections using natural language & repeat previous step for review/approval
			- else, approve and publish
		- updated schedule is saved
		- schedule is communicate
- As EO/ES/EA, I want to enable attendees to quickly and easily browse and access info about other attendees, so they can identify who they want to talk to and get some basic background info on the person they want to meet and speak with 
	- I want all attendees to be able to create a simple profile in the app, that all attendees can browse in a page on the app. The profile should contain:
		- professional profile (linkedin / meetup profile page)
			- Profile Pic (optional)
			- First Name
			- Last Name
			- Speaker/Guest (radio button)
				- if speaker, for each session they're booked for, list:
					- Topic Title
					- time
					- Room
			- Company (optional)
			- Role (optional)
			- LinkedIn profile (filed contains link to LinkedIn so user can launch the website/app and copy their profile URL)
			- email (optional)
	- Users find attendees by:
		- sorting list by name alphabetically
		- filter by speaker/guest
		- filter by text string (returns any profiles containing the query string)
- App contains:
	- Feed (updates posted by EO)
	- Program
		- Main stage
		- Demos stage
		- Open Sessions stage
	- Networking
		- list of all speakers and attendees info (see above)

Requirements:
- Keep it to absolute bare minimum, simple, must have functionality
- MUST be easy to publish any event updates
- Should be a PWA so it's super light and quick to load, works and looks great on any mobile device. I think once it's live and working, we'll encourage users to visit the site and save the PWA to their device home screen. We'll communicate the URL in outbound emails/message updates via the event platform (https://www.meetup.com/ai-meetup-copenhagen-innovators-creators-techies/events/316009297/?eventOrigin=group_events_list)
