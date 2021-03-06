# nwviz
NW.js visualizer

## To get it up and running
- Put in Activ8or credentials in **config.json**:  
   ```json
   "a8uname": "username",
   "a8pwd": "password"
   ```
   
- Put in CMS credentials in **config.json**:  
   ```json
   "cmsuname": "username",
   "cmspwd": "password"
   ```
   
- Put default CMS address, venue ID, and Activ8or IP in **config.json**:
    ```json
    "defaultCmsAddr": "https://commtix.appdelegates.net/ct/",
    "defaultVenueId": "0",
    "defaultA8Ip": "127.0.0.1"
    ```
    
   
- To run the app from the terminal, type in the path to the nwjs executable and then the path to the nwviz app:
    ```
    /Applications/nwjs.app/Contents/MacOS/nwjs /path/to/nwviz
    ```

- To distribute on a Mac as a single executable, run `zip -r ../app.nw *` to create your **app.nw** right outside the project directory, and then replace the **app.nw** in your NWJS application (located at `/path/to/nwjs.app/Contents/Resources/app.nw`) with your **app.nw**.
  - To change the app's icon, modify `nwjs.app/Contents/Resources/nw.icns`.
  - To add information about the app, modify `nwjs.app/Contents/Info.plist`.
  
## Additional notes
- Press ESC at any point to view and change the A8 IP address, the CMS address, and the venue ID.

- For JS visualizers to work properly:
  - They must have an index.html file in their root directory. 
  - If they login to Activ8or to get data, they must first use the UserDefaultsService to get "a8Ip", put the address in NW-compatible format, and set Activ8or's site origin:
  ```javascript
  var a8Ip = userDefaults.getStringForKey("a8Ip", "127.0.0.1"); 
  var a8Origin = 'http://' + a8Ip + ':1337';
  actv8API.setSiteOrigin(a8Origin);
  ```
    
- JS visualizers should additionally have an info.json file in their root directory with a duration (in sec) for how long to display the visualizer. The app will default to displaying a visualizer for 30 seconds.

- The streaming unzip process is weird and not very reliable, so .tgz compressed files for the JS visualizers should be used instead.

- NW.js does not support mp4 files, so convert videos to VP8 to use with this app (.webm, .mkv, .mov).

## Issues
- Right now, the JS visualizers are displayed for a certain amount of time (specified in their info.json file). For some visualizers, it might make more sense to have them display based on some other metric. To do this, there must be some sort of communication between the embedded viz and the app so the app can listen for when the viz signals it is done.

- Playlists on Commtix do not have a unique identifier, so choosing a playlist with the given venue ID is not working how it probably should be.

- When the JS visualizers don't work (a8 login is wrong, a8 site origin is wrong, lost internet connection, etc.) they don't show anything. I think this is something that has to be handled in the JS visualizers and not the app, though.

