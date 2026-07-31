# Quant-Site
Description: 
This website is a supplemental resource for students enrolled in an introductory quantitative course at Bryn Mawr College. It lists every question on the diagnostic math test, groups them by topic and subtopic, and for each subtopic gives a short summary, a link to the source it's based on, a video, and practice links. You can mark the questions you got wrong, and the site builds a study list out of them. There's also a link to a BoodleBox study bot you can chat with for personalised feedback. This project is in plain HTML, CSS, and JavaScript. It's hosted with GitHub Pages. The content (questions, links, summaries) is kept in a few small data files so it can be updated without touching the code that runs the page.

Details about the files:

- index.html- the page itself with the sidebar, the search box, and the BoodleBox link.
- styles.css- styling of the page: the colours, fonts, and layout. Background colour, text colour, accent colour, fonts are all at the very top in the :root section.
- styles.tree.css is extra styling features with the collapsible topic tree, the study-coach button, and the font settings.
- data.js lists every question, which subtopic it belongs to, and its resource links. It's generated from the spreadsheet by build.py.
- content.js has the summary, the source link, and the video for each subtopic. 
- groups.js defines the six sections and lists which subtopics go under each one. 
- resources.csv is the spreadsheet of all the links. build.py reads from it.
- build.py is a small script that rebuilds data.js from the spreadsheet.
- README.md is this file.
