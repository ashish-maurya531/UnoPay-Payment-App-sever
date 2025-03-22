
const checkGoogleVersion = async () => {
    try {
        const { default: gplay } = await import('google-play-scraper');  // Destructure the default export
        const appId = 'com.unotag.unopay';  // Your app ID

        const app = await gplay.app({ appId });
        return app.version;   // Return the version number
    } catch (error) {
        console.error('Error fetching version:', error);
        return null;  // Return null in case of error
    }
};





module.exports = {checkGoogleVersion};
