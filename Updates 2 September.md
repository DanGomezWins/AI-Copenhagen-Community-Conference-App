Ok update with the project sponsor:

- I'll receive real program and speaker information 48-24 hours before the event. In the meantime we'll continue testing with dummy data
## Updates
#### No user sign up, only sign in
- We will not have speakers or participants create their own profiles as this is a burden we want to remove. As this is a ticketed event, we'll have all the required info (at least name and email address) to create profiles in advance for guests and speakers, and we will prefill their profile info in advance with the data we have. For speakers, we'll have all the info we need (full name, email, company, professional profile summary etc)
- I've saved speaker profile information in here: "C:\Users\dango\Documents\Projects\AI Conference\AIC Info\Assets\AIMC CC speaker overview - Ark1.csv"
- I've saved speaker profiles and their keynote descriptions in here: "C:\Users\dango\Documents\Projects\AI Conference\AIC Info\Assets\AIMC Community Conference speakers & topics 2026.pdf"
- I've saved speaker photos here: C:\Users\dango\Documents\Projects\AI Conference\AIC Info\Assets\Speaker Photos 
- The current plan is we'll send an email(s) from an existing CRM/Email system (https://www.brevo.com/) to inform all guests that there is an app they can/should use with all info and it will be ready for them to use (profile created). We'd like the email to contain a link to the app, that will sign them in directly so they can start using it immediately
- Currently we use a magic link via email for sign in, so I hope and expect we can generate unique sign in links for all the users to include in the initial email that will lead them to a signed in session in the app
- We just need to make sure that no matter their entry point to the app, they will be able to sign in (with the same email they bought the ticket with) without any hassles or errors
#### User Profiles
- we won't include emails for security reasons. So only:
	- profile pic
	- full name
	- role
	- company
	- speaker tag (if a speaker)
	- professional profile (if a speaker)
	- schedule sessions (if a speaker)
#### My Program
- users should be able to star/favourite talks from the program to create their own personal program
- their personal program should present all their starred sessions across all rooms in chronological order in one list which is viewable from the Program page, accessible from a link or tab called My Schedule 
- The Open Sessions section is no longer needed under profile. It turns out that another person is creating their own system for generating the final schedule for the Open Sessions separately. Apparently the Open Sessions program will be hosted on it's own web page. So for now, let's disable (don't delete, just deactivate) the Open Sessions page and features and we'll simply have the Open Sessions tab in the Program page link to an external web page
- As time passes during the day, events that have transpired (i.e. current time is past the end time for a scheduled session) should be dimmed so it's easy to distinguish what's over and what's coming up
#### Design
- we want a lighter colour scheme (not dark mode)
- the app should be easy to read, high contrast
- the ui design should feature these accents or colour:
		4309FF
		99FCA0
		FF5555
- Use the Inter Google font for all or most of the app: https://fonts.google.com/specimen/Inter
- The app name should be: AIMC-CC (replace AI Meetup Copenhagen Community Conference #1)
#### Feed
- all participants (not just Organisers) can post to the feed with:
	- image
	- text
	- hyperlink url
- participants can edit/delete their own posts in the feed (keep this super simple)
- distinguish each the posts of organisers and participants so it's easier for users to sift through info
- There should be a character limit for posts to ensure the feed remains easy to read and looks good on a mobile device
#### Posting speaker slides
- we will obtain the speaker slides as a PDF in advance of the event, then auto post pdf slides for guests to download AFTER the speakers presentation has concluded (i.e. after the end time for each presentation)
- The slides for each speakers session should appear under the session details in the speaker profile pages
- once the end time for a speakers session has transpired, an auto post should post that the slides for that speakers session are available for download - but ONLY on the condition that the slides are available, i.e. there is a URL provided for the slides for a session for that speaker  
#### App Usage and Performance Tracking
- we want to track, measure & report on the performance of the app to learn from it and potentially use it as a success case for product development in future conversations
- create a metrics framework, based on the Google HEART framework. Create a csv file or spreadsheet that I can import into Google Sheets with the following columns
	- Heart Framework section
	- App Section
	- Goal of the feature or user interaction that we're tracking
	- Signals (what what we actually track)
	- Metric (the actual formula or calculation for creating the data we'll use to measure/evaluate)
	- hypotheses (potential outcomes we could expect to see and what they would mean)
	- Results: the actual results based on real data from users
	- Learnings: what we can infer from the data
	See this example: C:\Users\dango\Dropbox\Documents\OneDrive - Coloplast A S\Digital Health\CathNow\Pilot 1.0\Tracking\Metrics v1.xlsx
- I want a live dashboard displaying the KPIs for the app, showing the most important metrics from each of the HEART framework above, but which also allows us to deep dive into anything we planned to track in the spreadsheet
- I'd like to use a free, simple & popular app tracking platform (e.g Google Analytics? Is that still a thing?) that is super simple to setup, view and test based on the spreadsheet briefing above. Ideally, it's as simple as importing and uploading files to set it up 
- Add an About page, where users can read a short blurb about this app e.g. This app was created by Daniel Gomez-Windshuttle & Martin Schultz as an experiment (both names link to our profiles). Got feedback or suggestions? We'd love to hear it! (launches modal described below)
- Rate this app button should launch a modal or pop up that allows the user to rate the app out of 5 stars and also provides a free text field with a field label 'We'd love to hear your feedback or suggestions - it's anonymous' where users can enter their thoughts. All ratings and feedback should be stored for review later. Star ratings and any free text feedback should be paired together and viewable in a two column table that we can review later 
- We'd like guest to be able to rate and give feedback on particular sessions. Suggest we create a session page for each session, so when a user clicks on a session card in the program or in the speaker profile, it leads to a session page which has the session details but also a short description of the session. Then underneath that, we'd like a 'Rate this session' button which launches the same modal described above where users can rate the session out of 5 stars and optionally give some qualitative feedback in a free text field. All ratings and feedback should be saved and stored so we can review possibly share it with speakers later
#### Bugs spotted
- removed sessions should not appear with strike throughs in the speaker profile pages
#### Notes for discussion with martin:
- Ultimately what we need is a URL for the slides to be downloaded from in the app. This could be a URL to the file that we host (on the app server, on your Google Drive/Dropbox or the speakers URL to the deck on their own platform). Ideally you host all the speaker files and include the download URL with the speaker profile info itself (along with name, LinkedIn URL etc etc). We should ensure the file format is a PDF (no other file formats) for simplicity

