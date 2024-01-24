import express from "express";
import { getAlbumData, extractAlbumData, fetchImages, getAlbumDetails, searchAlbums } from "./utils.js";

const app = express();
const port = 3000;

// Middleware
// app.use(express.urlencoded({ extended: true }));
app.use(express.static("public"));

app.get("/", async (req, res) => {
    try {
        const sortBy = req.query.sort; // Get the sorting criteria from the query parameter
        const searchQuery = req.query.searchQuery // Getting the search criteria from the query parameter
        let albumsData;

        if (searchQuery) {
            // If searchQuery is present, perform a search
            albumsData = await searchAlbums(searchQuery);
        } else {
            // If no searchQuery, fetch all albums
            albumsData = await getAlbumData(sortBy);
        }

        const images = await fetchImages(albumsData);
        const extractedData = extractAlbumData(albumsData);

        // Render the .ejs file with the images and additional data
        res.render("index.ejs", {
            albumCover: images,
            albumDetails: extractedData
        });
    } catch (err) {
        console.log("ERROR when trying to render index.ejs page:", err)
    };
});

app.get("/album-details", async (req, res) => {
    try {
        const selectedAlbumId = req.query.albumId
        // Fetch album details based on albumId
        const albumDetails = await getAlbumDetails(selectedAlbumId);
        // Render the album-details.ejs page with the fetched details
        res.render("album-details.ejs", {
            albumDetails: albumDetails
        });
    } catch (err) {
        console.log("ERROR when trying to render album-details.ejs page:", err);
    };
});

app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});
