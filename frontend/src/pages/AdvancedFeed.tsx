import React, { useState, useEffect, useRef } from 'react';
import AudioEngine from '../audioEngine';
// Import your audio samples
import Clap from "../samples/Clap.wav";
import Hat from "../samples/Hat.wav";
import Kick from "../samples/Kick.wav";
import Snare from "../samples/Snare.wav";
import { Track, DrumLoop } from '../DrumLoopLogic';

// Types

interface Post {
    id: string;
    title: string;
    pattern: DrumLoop;
    authorName: string;
    likes: number;
}

// Utility function for note colors
const getNoteColor = (noteIndex: number, isActive: boolean) => {
    const isDarkGroup = Math.floor(noteIndex / 4) % 2 !== 0;
    if (isActive) {
        return isDarkGroup ? "bg-green-600" : "bg-green-500";
    }
    return isDarkGroup ? "bg-gray-300" : "bg-gray-200";
};

// Advanced Drum Machine Component
const DrumMachine = ({
    pattern,
    setPattern,
    readonly = false,
    isPlaying = false,
    onPlayToggle
}: {
    pattern: DrumLoop;
    setPattern?: (pattern: DrumLoop) => void;
    readonly?: boolean;
    isPlaying?: boolean;
    onPlayToggle?: (playing: boolean) => void;
}) => {
    const audioEngineRef = useRef<AudioEngine | null>(null);

    useEffect(() => {
        // Initialize audio engine regardless of readonly status
        audioEngineRef.current = new AudioEngine(pattern);

        return () => {
            if (audioEngineRef.current) {
                audioEngineRef.current.stop();
            }
        };
    }, []); // Only run on mount

    useEffect(() => {
        if (audioEngineRef.current) {
            audioEngineRef.current.updateDrumLoop(pattern);
        }
    }, [pattern]);

    // Update playback state when isPlaying prop changes
    useEffect(() => {
        if (audioEngineRef.current) {
            if (isPlaying) {
                audioEngineRef.current.play();
            } else {
                audioEngineRef.current.stop();
            }
        }
    }, [isPlaying]);

    const handleToggleNote = (trackIndex: number, noteIndex: number) => {
        if (readonly || !setPattern) return;

        const newTracks = pattern.tracks.map((track, i) => {
            if (i === trackIndex) {
                const newPattern = [...track.pattern];
                newPattern[noteIndex] = !newPattern[noteIndex];
                return { ...track, pattern: newPattern };
            }
            return track;
        });
        setPattern({ ...pattern, tracks: newTracks });
    };

    const handleToggleMute = (trackIndex: number) => {
        if (readonly || !setPattern) return;

        const newTracks = pattern.tracks.map((track, i) =>
            i === trackIndex ? { ...track, muted: !track.muted } : track
        );
        setPattern({ ...pattern, tracks: newTracks });
    };

    const handleBpmChange = (newBpm: number) => {
        if (readonly || !setPattern) return;

        if (isNaN(newBpm) || newBpm < 1 || newBpm > 10000) {
            setPattern({ ...pattern, bpm: 128 });
        } else {
            setPattern({ ...pattern, bpm: newBpm });
        }
    };

    const handlePlayToggle = () => {
        if (!onPlayToggle) return;
        onPlayToggle(!isPlaying);
    };

    return (
        <div className="space-y-4 p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-2">
                    <label htmlFor="bpm-input">BPM:</label>
                    <input
                        type="number"
                        id="bpm-input"
                        value={pattern.bpm}
                        onChange={(e) => handleBpmChange(Number(e.target.value))}
                        className="w-20 px-2 py-1 border rounded"
                        disabled={readonly}
                    />
                </div>
                <button
                    onClick={handlePlayToggle}
                    className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                >
                    {isPlaying ? 'Stop' : 'Play'}
                </button>
            </div>

            <div className="space-y-3">
                {pattern.tracks.map((track, trackIndex) => (
                    <div key={trackIndex} className="flex items-center gap-3">
                        <button
                            onClick={() => handleToggleMute(trackIndex)}
                            className={`w-20 px-2 py-1 rounded text-white ${track.muted ? 'bg-red-500' : 'bg-green-500'
                                } ${readonly ? 'opacity-50 cursor-not-allowed' : ''}`}
                            disabled={readonly}
                        >
                            {track.muted ? 'Unmute' : 'Mute'}
                        </button>

                        <span className="w-16 text-sm">{track.name}</span>

                        <div className="grid grid-flow-col auto-cols-max gap-1">
                            {track.pattern.map((note, noteIndex) => (
                                <button
                                    key={noteIndex}
                                    onClick={() => handleToggleNote(trackIndex, noteIndex)}
                                    className={`w-4 h-6 rounded ${getNoteColor(noteIndex, note)
                                        } ${readonly ? 'cursor-default' : 'hover:opacity-80'}`}
                                    disabled={readonly}
                                />
                            ))}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

// Create Post Component
const CreatePost = ({ addPost }: { addPost: (post: Post) => void }) => {
    const [title, setTitle] = useState('');
    const [authorName, setAuthorName] = useState('');
    const [isPlaying, setIsPlaying] = useState(false);
    const [pattern, setPattern] = useState<DrumLoop>({
        bpm: 128,
        tracks: [
            { name: "Kick", audioId: Kick, pattern: Array(32).fill(false), muted: false },
            { name: "Snare", audioId: Snare, pattern: Array(32).fill(false), muted: false },
            { name: "Clap", audioId: Clap, pattern: Array(32).fill(false), muted: false },
            { name: "Hat", audioId: Hat, pattern: Array(32).fill(false), muted: false }
        ],
        isPlaying: false,
        currentPlayIndex: 0
    });

    const handleSubmit = () => {
        if (title.trim() && authorName.trim()) {
            addPost({
                id: Date.now().toString(),
                title,
                pattern,
                authorName,
                likes: 0
            });
            setTitle('');
            setAuthorName('');
            setIsPlaying(false);
            // Reset pattern to default
            setPattern({
                bpm: 128,
                tracks: [
                    { name: "Kick", audioId: Kick, pattern: Array(32).fill(false), muted: false },
                    { name: "Snare", audioId: Snare, pattern: Array(32).fill(false), muted: false },
                    { name: "Clap", audioId: Clap, pattern: Array(32).fill(false), muted: false },
                    { name: "Hat", audioId: Hat, pattern: Array(32).fill(false), muted: false }
                ],
                isPlaying: false,
                currentPlayIndex: 0
            });
        }
    };

    return (
        <div className="p-6 bg-white rounded-lg shadow-lg">
            <h2 className="text-xl font-bold mb-4">Create Beat</h2>
            <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full p-2 border rounded mb-3"
                placeholder="Give your beat a name"
            />
            <input
                type="text"
                value={authorName}
                onChange={(e) => setAuthorName(e.target.value)}
                className="w-full p-2 border rounded mb-4"
                placeholder="Your name"
            />
            <DrumMachine
                pattern={pattern}
                setPattern={setPattern}
                isPlaying={isPlaying}
                onPlayToggle={setIsPlaying}
            />
            <button
                onClick={handleSubmit}
                className="w-full mt-4 bg-blue-500 text-white p-2 rounded hover:bg-blue-600"
            >
                Share Beat
            </button>
        </div>
    );
};

// Post Component
const Post = ({ post, onLike }: { post: Post; onLike: (id: string) => void }) => {
    const [isPlaying, setIsPlaying] = useState(false);

    const handlePlayToggle = () => {
        setIsPlaying((prev) => !prev);
    };

    return (
        <div className="p-6 bg-white rounded-lg shadow-lg mb-6">
            <div className="flex justify-between items-center mb-4">
                <div>
                    <h3 className="text-lg font-semibold">{post.title}</h3>
                    <p className="text-sm text-gray-600">Created by {post.authorName}</p>
                </div>
                <button
                    onClick={() => onLike(post.id)}
                    className="px-4 py-2 rounded bg-red-100 text-red-500"
                >
                    ❤️ {post.likes}
                </button>
            </div>

            <DrumMachine
                pattern={post.pattern}
                readonly={true}
                isPlaying={isPlaying}
                onPlayToggle={setIsPlaying}
            />
        </div>
    );
};

// Main Feed Component
const Feed = () => {
    const [posts, setPosts] = useState<Post[]>([]);

    const addPost = (post: Post) => {
        setPosts([post, ...posts]);
    };

    const handleLike = (postId: string) => {
        setPosts(posts.map(post =>
            post.id === postId
                ? { ...post, likes: post.likes + 1 }
                : post
        ));
    };

    return (
        <div className="max-w-4xl mx-auto p-4">
            <h1 className="text-2xl font-bold text-center mb-8">Drum Pattern Feed</h1>
            <div className="space-y-8">
                <CreatePost addPost={addPost} />
                <div className="mt-8">
                    {posts.map((post) => (
                        <Post key={post.id} post={post} onLike={handleLike} />
                    ))}
                </div>
            </div>
        </div>
    );
};

export default Feed;
