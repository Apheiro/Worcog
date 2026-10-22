use crate::validation::Result;
use rodio::{buffer::SamplesBuffer, Decoder, OutputStream, OutputStreamBuilder, Sink, Source};
use std::{fs, path::Path, sync::{Arc, atomic::{AtomicBool, Ordering}}, time::Duration};

pub struct Audio {
    sink: Sink,
    _stream: OutputStream,
    failed: Arc<AtomicBool>,
}

pub fn decode(path: &Path) -> Result<SamplesBuffer> {
    let metadata = fs::metadata(path).map_err(|error| error.to_string())?;
    if !metadata.is_file() || metadata.len() == 0 || metadata.len() > 10 * 1024 * 1024 {
        return Err("Choose an audio file between 1 byte and 10 MiB.".into());
    }
    let decoder = Decoder::try_from(fs::File::open(path).map_err(|error| error.to_string())?)
        .map_err(|_| "Unsupported or invalid audio. Choose WAV, MP3, OGG or FLAC.".to_string())?;
    let channels = decoder.channels();
    let rate = decoder.sample_rate();
    if channels == 0 || channels > 2 || rate == 0 || rate > 96_000 {
        return Err("Choose mono or stereo audio up to 96 kHz.".into());
    }
    let limit = (u64::from(channels) * u64::from(rate) * 60) as usize;
    let samples: Vec<f32> = decoder.take(limit + 1).collect();
    if samples.is_empty() || samples.len() > limit || samples.iter().any(|sample| !sample.is_finite()) {
        return Err("Choose valid audio up to 60 seconds long.".into());
    }
    Ok(SamplesBuffer::new(channels, rate, samples))
}

fn default_tone() -> SamplesBuffer {
    let rate = 44_100;
    let samples = (0..rate * 3).map(|index| {
        let time = index as f32 / rate as f32;
        if time >= 0.45 { return 0.0; }
        let envelope = (std::f32::consts::PI * time / 0.45).sin().powi(2);
        let phase = std::f32::consts::TAU * 660.0 * time;
        (phase.sin() + 0.2 * (phase * 1.5).sin()) * envelope * 0.25
    }).collect::<Vec<_>>();
    SamplesBuffer::new(1, rate, samples)
}

impl Audio {
    pub fn start(path: Option<&Path>, volume: u8, repeat: bool) -> Result<(Self, Option<String>)> {
        let (source, warning) = match path.map(decode) {
            Some(Ok(source)) => (source, None),
            Some(Err(error)) => (default_tone(), Some(format!("Custom sound unavailable; using the default tone. {error}"))),
            None => (default_tone(), None),
        };
        let failed = Arc::new(AtomicBool::new(false));
        let flag = failed.clone();
        let mut stream = OutputStreamBuilder::from_default_device()
            .map_err(|_| "No audio output device is available.".to_string())?
            .with_error_callback(move |_| { flag.store(true, Ordering::Relaxed); })
            .open_stream().map_err(|error| format!("Could not play reminder sound: {error}"))?;
        stream.log_on_drop(false);
        let sink = Sink::connect_new(stream.mixer());
        sink.set_volume(f32::from(volume) / 100.0);
        if repeat { sink.append(source.repeat_infinite()); }
        else { sink.append(source.take_duration(Duration::from_secs(5))); }
        Ok((Self { sink, _stream: stream, failed }, warning))
    }
    pub fn failed(&self) -> bool { self.failed.load(Ordering::Relaxed) }
    pub fn empty(&self) -> bool { self.sink.empty() }
    pub fn volume(&self, volume: u8) { self.sink.set_volume(f32::from(volume) / 100.0); }
}
