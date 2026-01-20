export const playWarpSequence = () => {
    const audioFiles = {
        robot: '/sounds/robot_chatter.wav',
        warp: '/sounds/warp_whoosh.wav',
        // rumble: '/sounds/rumble.mp3',
        // blip: '/sounds/robot_blip.wav'
    };

    const play = (file, volume = 0.5, playbackRate = 1) => {
        const audio = new Audio(file);
        audio.volume = volume;
        audio.playbackRate = playbackRate;
        audio.play().catch(e => console.error("Audio play failed:", e));
        return audio;
    };

    // 1. Robot chatter at start of transformation
    play(audioFiles.robot, 0.8, 1.2);
    play(audioFiles.robot, 0.6, 0.8); // Layered for complexity

    // 2. Deep Rumble (Gorilla roar pitched down?) - Low volume texture
    const rumble = play(audioFiles.rumble, 0.2, 0.5); 
    
    // 3. Warp Whoosh (The main event)
    play(audioFiles.warp, 1.0, 0.8);

    // 4. Robot Blips
    setTimeout(() => play(audioFiles.blip, 0.4, 2.0), 100);
    setTimeout(() => play(audioFiles.blip, 0.4, 1.5), 300);

    // Cleanup rumble
    setTimeout(() => { if(rumble) rumble.pause(); }, 2000);
};

export const playEngageSound = () => {
    const tones = [
        '/sounds/robot_blip.wav',
        '/sounds/robot_chatter.wav'
    ];
    
    // High pitch confirmation beep REMOVED
    
    // Heavy locking sound (chatter pitched down)
    const lock = new Audio(tones[1]);
    lock.volume = 0.8;
    lock.playbackRate = 0.5;
    setTimeout(() => lock.play().catch(() => {}), 50);
};
