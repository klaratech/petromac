Petromac Trade Show Kiosk Storyboard

Overview

This storyboard outlines the flow and content strategy for a kiosk-style interactive display for Petromac (www.petromac.co.nz), to be used at trade shows.
The display is designed to attract passive viewers with a video loop, and engage interested users with an interactive carousel organized by problem/solution themes.
	1.	Idle Mode (Attract Loop)

⸻

	•	Visuals:
	•	Looping 30–60 second high-definition video showcasing:
	•	Tool Taxis, Guides, and Conveyance tools in operation
	•	Successful deployments around the world
	•	Animated metrics (job success rate, deviation reach, drag coefficients)
	•	Locations featured: Gulf of Mexico, Middle East, Asia-Pacific, etc.
	•	Behavior:
	•	No text overlays or call-to-action
	•	Loop plays automatically
	•	Touch/click anywhere on the screen opens the carousel interface

	2.	User Engagement

⸻

	•	Trigger: Any touch or click on the screen
	•	Transition: Smooth fade from video loop into the carousel interface

	3.	Main Interface – 3D Carousel

⸻

	•	Navigation: Swipe, arrow keys, or click to rotate through content panels
	•	Each panel represents a key challenge in wireline logging and Petromac’s solution
	•	Optional content formats: Videos, animated diagrams, case studies, or interactive infographics

Carousel Cards (Problem/Solution-Focused)
	1.	
	•	Title: “Global Impact”
		Goal: Build trust and global credibility
	•	Action: Opens a dashboard interface with an interactive map for country-wise stats and metrics
	2.	Conveyance, Solved
	•	Title: “Conveyance, Solved”
	•	Problem: Deviation >50°, ledges, well access challenges
	•	Solution: Tool Taxis and Guide Systems
	•	Visuals: Wellbore diagrams and animations
	•	Metric: 3% drag vs. 35% standard
	•	Action: Opens a modal with diagrams and narrated video
	3.	No More Tool Sticking
	•	Title: “No More Tool Sticking”
	•	Problem: Tool drag and differential sticking
	•	Solution: Orientation & taxi wheels
	•	Metric: Required force drops from 2800lbs to 700lbs
	•	Action: Opens a modal with side-by-side animation
	4.	Precise Tool Orientation
	•	Title: “Precise Tool Orientation”
	•	Problem: Sensor misalignment, rotational tracking
	•	Solution: Orientation Taxi + low center of gravity
	•	Outcome: Better sensor data, even in high-deviation wells
	•	Action: Opens a modal with orientation visualization
	5.	Better Data at First Run
	•	Title: “Enhanced Sampling & Imaging”
	•	Problem: Stick-slip, probe misalignment, pad overlap
	•	Solution: Oriented sampling, dual density, caliper force management
	•	Visual: Side-by-side imaging logs before and after Petromac tech
	•	Action: Modal with image comparison and captions
	6.	No Obstacles Too Tough
	•	Title: “Navigating Ledges & Washouts”
	•	Problem: Tool obstruction due to washouts and casing changes
	•	Solution: Skiing guides, ledge-avoidance
	•	Story: “Simple job” saved 5 rig days with Petromac involved
	•	Action: Modal with video clip and before/after timeline

	8.	Title: “Engineering Excellence”
	•	Action: Opens a separate interface with a 3D carousel of devices
	•	Each device opens into a 3D viewer with rotation, zoom, and specs
	9.	Content Viewer

⸻

	•	Fullscreen or modal viewer for detailed exploration
	•	Interactive navigation inside each content piece
	•	Support for videos, slide decks, images, and text

	5.	Inactivity Reset

⸻

	•	Timer: After 60 seconds of no interaction, auto-reset to attract loop
	•	Transition: Smooth fade back into looping video

Visual Style
	•	Theme: Industrial, high-tech, minimal
	•	Color Scheme: Charcoal gray, white, and accents in Petromac orange/blue
	•	Typography: Bold headlines, clean sans-serif body
	•	Motion: Subtle parallax and kinetic animations for depth and engagement

-----------



const items = [
  { title: 'Global Deployment', image: 'global.jpg', type: 'dashboard', link: '/dashboard' },
  { title: 'Well Access', image: 'wellaccess.jpg', type: 'modal' },
  { title: 'No More Tool Sticking', image: 'sticking.jpg', type: 'modal' },
  { title: 'No More Stuck Tools', image: 'stuck.jpg', type: 'modal' },
  { title: 'No more pipe conveyance' image:'tlc.jpg', type: 'modal'},
  { title: 'Precise Tool Orientation', image: 'orientation.jpg', type: 'modal' },
  { title: 'Centralization - CH', image: 'focusCH.jpg', type: 'modal' },
  { title: 'Centralization - OH', image: 'focus OH.jpg', type: 'modal' },
  { title: 'Wireline Jar', image: 'thor.jpg', type: 'modal' },
  { title: 'Catalog', image: 'devices.jpg', type: 'modal' },
];

