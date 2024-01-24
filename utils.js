import axios from "axios";
import pg from "pg";

const db = new pg.Client({
    user: "postgres",
    host: "localhost",
    database: "tunetrove",
    password: "P05tgr35%4319857",
    port: 5432,
});

db.connect();

// Simple in-memory cache for image URLs
const imageCache = new Map();

// Function to get all the rows in the albums table
export async function getAlbumData(sortBy) {
    let query = await db.query("SELECT id, title, artist, genre, mbid FROM albums ORDER BY id ASC");

    if (sortBy) {
        if (sortBy === "title" || sortBy === "artist" || sortBy === "genre") {
            query = await db.query(`SELECT id, title, artist, genre, mbid FROM albums ORDER BY ${sortBy} ASC`);
        }
    }

    return query.rows;
};

// Function to extract all the rows from each column and return it to the parameter
export function extractAlbumData(albums) {
    const ids = [];
    const titles = [];
    const artists = [];
    const genres = [];

    for (const album of albums) {
        ids.push(album.id);
        titles.push(album.title);
        artists.push(album.artist);
        genres.push(album.genre);
    }

    return {
        id: ids,
        title: titles,
        artist: artists,
        genre: genres,
    };
};

// Function to fetch each imageURL using the API with caching
export async function fetchImages(albums) {
    const imageRequests = albums.map(async (album) => {
        if (imageCache.has(album.mbid)) {
            // Use cached image URL
            return imageCache.get(album.mbid);
        } else {
            // Fetch image URL from API
            const API_URL = `https://coverartarchive.org/release/${album.mbid}`;
            const response = await axios.get(API_URL);
            const imageURL = response.data.images[0].thumbnails.small;

            // Cache image URL
            imageCache.set(album.mbid, imageURL);

            return imageURL;
        }
    });

    // Use Promise.all to fetch images concurrently
    return Promise.all(imageRequests);
};

// Function to get album details based on albumId
export async function getAlbumDetails(albumId) {
    const result = await db.query("SELECT * FROM albums WHERE id = ($1);", [albumId]);
    const album = result.rows[0]; // Assuming there's only one matching album

    // Fetch cover image using the album's mbid with caching
    if (imageCache.has(album.mbid)) {
        // Use cached image URL
        album.coverImage = imageCache.get(album.mbid);
    } else {
        const API_URL = `https://coverartarchive.org/release/${album.mbid}`;
        const response = await axios.get(API_URL);
        album.coverImage = response.data.images[0].thumbnails.small;

        // Cache image URL
        imageCache.set(album.mbid, album.coverImage);
    }

    return album;
};

// Function to search for albums based on the query received from frontend
export async function searchAlbums(query) {
    const result = await db.query(
        "SELECT id, title, artist, genre, mbid FROM albums WHERE title ILIKE $1 OR artist ILIKE $1 OR genre ILIKE $1;",
        [`%${query}%`]
    );
    return result.rows;
};