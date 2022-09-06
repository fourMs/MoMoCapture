rm momocapture.apk
ionic cordova build android --prod --release
"C:/Program Files/Java/jdk1.8.0_241/bin/jarsigner.exe" -tsa http://timestamp.digicert.com -verbose -sigalg SHA1withRSA -digestalg SHA1 -keystore ../momocapture.keystore platforms/android/app/build/outputs/apk/release/app-release-unsigned.apk alias_name #execute in cmd, not in power shell
"D:/Android/Sdk/build-tools/31.0.0/zipalign.exe" -v 4 platforms/android/app/build/outputs/apk/release/app-release-unsigned.apk momocapture.apk

rm momocapture.aab
ionic cordova build android
./platforms/android/gradlew bundle #in this part go to the platforms/android folder and execute, but before, create the local.properties with the sdk if it is not found, execute  .\gradlew bundle in powershell
"C:/Program Files/Java/jdk1.8.0_241/bin/jarsigner.exe" -tsa http://timestamp.digicert.com -verbose -sigalg SHA1withRSA -digestalg SHA1 -keystore ../momocapture.keystore platforms/android/app/build/outputs/bundle/release/app.aab alias_name
"D:/Android/Sdk/build-tools/31.0.0/zipalign.exe" -v 4 platforms/android/app/build/outputs/bundle/release/app.aab momocapture.aab

#Use this new way, the other ones above are deprecated
rm momocapture.apk
ionic cordova build android --prod --release
#Execute next lines in cmd and open it in teh location of this repo
"D:/Android/Sdk/build-tools/31.0.0/zipalign.exe" -f 4 platforms/android/app/build/outputs/apk/release/app-release-unsigned.apk momocapture.apk
"D:/Android/Sdk/build-tools/31.0.0/apksigner.bat" sign --ks ../momocapture.keystore --ks-pass file:../momocapture_pass.txt --v1-signing-enabled true --v2-signing-enabled true momocapture.apk
