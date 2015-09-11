# nwviz
NW.js visualizer

## To get it up and running
- Put in Activ8or credentials in **line 59** of app/nwviz.module.js:
  - 'actv8API.authorize(*username*, *password*)'
- Put in CMS credentials in **line 48** of app/shared/Services/PlaylistService.js:
  - '.send({username: *username*, password: *password*})'
  
## Additional notes
- Press ESC at any point to view and change the A8 IP address, the CMS address, and the venue ID.
- For JS visualizers to work properly:
  - They must have an index.html file in their root directory. 
  - If they login to Activ8or to get data, they must first use the UserDefaultsService to get "a8Ip", put the address in NW-compatible format, and set Activ8or's site origin:
    '''
    var a8Ip = userDefaults.getStringForKey("a8Ip", "127.0.0.1");
    var a8Origin = 'http://' + a8Ip + ':1337';
    actv8API.setSiteOrigin(a8Origin);
    '''
- JS visualizers should additionally have an info.json file in their root directory with a duration (in ms) for how long to display the visualizer. The app will default to displaying a visualizer for 30 seconds.