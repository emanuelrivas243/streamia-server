import { Router } from 'express';
import {
    deleteMovie,
    exploreMovies,
    getMovieById,
    getMovies,
    getMovieSubtitles,
    updateMovie,
    upload,
    uploadMovie,
    uploadSubtitles
} from '../controllers/movieController';

const router = Router();

/**
 * @route   GET /api/movies
 * @desc    Get all movies from Cloudinary
 * @access  Public
 */
router.get('/', getMovies);

/**
 * @route   GET /api/movies/explore
 * @desc    Explore movies with filters and search
 * @access  Public
 * @query   {string} category - Filter by category
 * @query   {string} search - Search by title
 */
router.get('/explore', exploreMovies);

/**
 * @route   GET /api/movies/:id
 * @desc    Get movie by ID
 * @access  Public
 * @param   {string} id - Movie ID or Cloudinary Public ID
 */
router.get('/:id', getMovieById);

/**
 * @route   POST /api/movies/upload
 * @desc    Upload a movie to Cloudinary
 * @access  Private (deberías agregar middleware de autenticación después)
 * @body    {string} title - Movie title
 * @body    {string} description - Movie description
 * @body    {string} category - Movie category
 * @file    {video} video - Video file (MP4, MOV, AVI, MKV, WEBM)
 */
router.post('/upload', upload.single('video'), uploadMovie);

/**
 * @route   POST /api/movies/:id/subtitles
 * @desc    Upload subtitles for a movie
 * @access  Private
 * @param   {string} id - Movie ID
 * @body    {string} language - Language code (es, en, fr, etc.)
 * @body    {string} label - Language label (Español, English, etc.)
 * @file    {subtitle} subtitle - Subtitle file (VTT, SRT)
 */
router.post('/:id/subtitles', upload.single('subtitle'), uploadSubtitles);

/**
 * @route   GET /api/movies/:id/subtitles
 * @desc    Get all subtitles for a movie
 * @access  Public
 * @param   {string} id - Movie ID
 */
router.get('/:id/subtitles', getMovieSubtitles);

/**
 * @route   PUT /api/movies/:id
 * @desc    Update a movie
 * @access  Private
 * @param   {string} id - Movie ID
 * @body    {Object} updates - Movie fields to update
 */
router.put('/:id', updateMovie);

/**
 * @route   DELETE /api/movies/:id
 * @desc    Delete a movie
 * @access  Private
 * @param   {string} id - Movie ID
 */
router.delete('/:id', deleteMovie);

export default router;