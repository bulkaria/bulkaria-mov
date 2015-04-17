cd ~/Projects/bulkaria-mov
cordova build --release android
cd platforms/android/ant-build/
cp MainActivity-release-unsigned.apk bulkaria-mov-unsigned.apk
jarsigner -verbose -sigalg SHA1withRSA -digestalg SHA1 -keystore ~/federico.brinkworth@gmail.com/Bulkaria/bulkaria.keystore bulkaria-mov-unsigned.apk bulkaria
~/Android/Sdk/build-tools/21.1.2/zipalign -v 4 bulkaria-mov-unsigned.apk bulkaria-mov.apk
mv bulkaria-mov.apk ~/federico.brinkworth@gmail.com/Bulkaria/release