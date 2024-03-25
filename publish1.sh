#Go to the new way to build ***
rm momocapture.apk
ionic cordova build android --prod --release
"C:/Program Files/Java/jdk1.8.0_241/bin/jarsigner.exe" -tsa http://timestamp.digicert.com -verbose -sigalg SHA1withRSA -digestalg SHA1 -keystore ../momocapture.keystore platforms/android/app/build/outputs/apk/release/app-release-unsigned.apk alias_name #execute in cmd, not in power shell
"D:/Android/Sdk/build-tools/31.0.0/zipalign.exe" -v 4 platforms/android/app/build/outputs/apk/release/app-release-unsigned.apk momocapture.apk

rm momocapture.aab
ionic cordova build android
./platforms/android/gradlew bundle #in this part go to the platforms/android folder and execute, but before, create the local.properties with the sdk if it is not found, execute  .\gradlew bundle in powershell
"C:/Program Files/Java/jdk1.8.0_241/bin/jarsigner.exe" -tsa http://timestamp.digicert.com -verbose -sigalg SHA1withRSA -digestalg SHA1 -keystore ../momocapture.keystore platforms/android/app/build/outputs/bundle/release/app.aab alias_name
"D:/Android/Sdk/build-tools/31.0.0/zipalign.exe" -v 4 platforms/android/app/build/outputs/bundle/release/app.aab momocapture.aab

#***Use this new way, the other ones above are deprecated
#This line can executed in power shell or terminal (Win11)
rm momocapture.apk
#Execute next lines in cmd (NOT Power Shell) and open it in the location of this repo
#IMPORTAN: You might need to delete the generated folder 'platforms' if the following line throw errors and execute again
ionic cordova build android --prod --release
# in [YOUR PATH HERE] put the right path for the Android SDK
"[YOUR PATH HERE]/Android/Sdk/build-tools/34.0.0/zipalign.exe" -f 4 platforms/android/app/build/outputs/apk/release/app-release-unsigned.apk momocapture.apk

"[YOUR PATH HERE]/Android/Sdk/build-tools/34.0.0/apksigner.bat" sign --ks ../momocapture.keystore --ks-pass file:../momocapture_pass.txt --v1-signing-enabled true --v2-signing-enabled true momocapture.apk
