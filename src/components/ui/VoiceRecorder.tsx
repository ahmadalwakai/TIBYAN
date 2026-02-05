"use client";

import { Box, Button, Flex, IconButton, Text } from "@chakra-ui/react";
import { useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";

interface VoiceRecorderProps {
  onRecordingComplete: (blob: Blob, duration: number) => void;
  maxDuration?: number; // in seconds
  disabled?: boolean;
}

export default function VoiceRecorder({
  onRecordingComplete,
  maxDuration = 120,
  disabled = false,
}: VoiceRecorderProps) {
  const t = useTranslations("ui.voiceRecorder");
  const [isRecording, setIsRecording] = useState(false);
  const [duration, setDuration] = useState(0);
  const [audioLevel, setAudioLevel] = useState(0);
  const [waveOffset, setWaveOffset] = useState(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animationRef = useRef<number | null>(null);
  const isRecordingRef = useRef(false);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  // Use ref to track recording state for animation callback
  useEffect(() => {
    isRecordingRef.current = isRecording;
  }, [isRecording]);

  // Animation loop for audio level visualization
  useEffect(() => {
    if (!isRecording) return;

    const updateAudioLevel = () => {
      if (analyserRef.current && isRecordingRef.current) {
        const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
        analyserRef.current.getByteFrequencyData(dataArray);
        const average = dataArray.reduce((a, b) => a + b) / dataArray.length;
        setAudioLevel(average / 255);
        setWaveOffset((prev) => prev + 0.05);
        animationRef.current = requestAnimationFrame(updateAudioLevel);
      }
    };

    animationRef.current = requestAnimationFrame(updateAudioLevel);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [isRecording]);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      // Set up audio analysis for visual feedback
      const audioContext = new AudioContext();
      const source = audioContext.createMediaStreamSource(stream);
      const analyser = audioContext.createAnalyser();
      analyser.fftSize = 256;
      source.connect(analyser);
      analyserRef.current = analyser;

      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: MediaRecorder.isTypeSupported("audio/webm")
          ? "audio/webm"
          : "audio/mp4",
      });

      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunksRef.current.push(e.data);
        }
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: mediaRecorder.mimeType });
        onRecordingComplete(blob, duration);
        stream.getTracks().forEach((track) => track.stop());
        audioContext.close();
      };

      mediaRecorder.start(100);
      setIsRecording(true);
      setDuration(0);

      // Start timer
      timerRef.current = setInterval(() => {
        setDuration((d) => {
          if (d >= maxDuration - 1) {
            stopRecording();
            return d;
          }
          return d + 1;
        });
      }, 1000);

      // Audio level monitoring starts automatically via useEffect when isRecording becomes true
    } catch (error) {
      console.error("Error starting recording:", error);
      alert(t("microphoneError"));
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
        animationRef.current = null;
      }
      setAudioLevel(0);
    }
  };

  const cancelRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stream.getTracks().forEach((track) => track.stop());
      setIsRecording(false);
      chunksRef.current = [];
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
        animationRef.current = null;
      }
      setAudioLevel(0);
      setDuration(0);
    }
  };

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    };
  }, []);

  if (isRecording) {
    return (
      <Flex
        align="center"
        gap={3}
        bg="red.900/20"
        borderRadius="full"
        px={4}
        py={2}
        border="1px solid"
        borderColor="red.500/50"
      >
        {/* Recording indicator with audio level */}
        <Box position="relative">
          <Box
            w="12px"
            h="12px"
            borderRadius="full"
            bg="red.500"
            css={{
              animation: "pulse 1s ease-in-out infinite",
              "@keyframes pulse": {
                "0%, 100%": { opacity: 1, transform: "scale(1)" },
                "50%": { opacity: 0.5, transform: "scale(1.2)" },
              },
            }}
          />
          {/* Audio level ring */}
          <Box
            position="absolute"
            inset="-4px"
            borderRadius="full"
            border="2px solid"
            borderColor="red.400"
            opacity={audioLevel}
            transform={`scale(${1 + audioLevel * 0.5})`}
            transition="all 0.1s"
          />
        </Box>

        {/* Duration */}
        <Text color="red.300" fontWeight="600" fontSize="sm" minW="45px">
          {formatTime(duration)}
        </Text>

        {/* Audio wave visualization */}
        <Flex align="center" gap={0.5} h="20px">
          {[...Array(8)].map((_, i) => (
            <Box
              key={i}
              w="3px"
              bg="red.400"
              borderRadius="full"
              h={`${Math.max(4, audioLevel * 20 * (1 + Math.sin(i * 0.8 + waveOffset) * 0.5))}px`}
              transition="height 0.05s"
            />
          ))}
        </Flex>

        {/* Cancel button */}
        <IconButton
          aria-label={t("cancelRecording")}
          size="sm"
          variant="ghost"
          colorPalette="red"
          onClick={cancelRecording}
        >
          ✕
        </IconButton>

        {/* Send button */}
        <Button
          size="sm"
          colorPalette="green"
          onClick={stopRecording}
          borderRadius="full"
        >
          {t("send")}
        </Button>
      </Flex>
    );
  }

  return (
    <IconButton
      aria-label={t("recordVoice")}
      variant="ghost"
      colorPalette="brand"
      onClick={startRecording}
      disabled={disabled}
      borderRadius="full"
      _hover={{ bg: "brand.500/20" }}
    >
      🎤
    </IconButton>
  );
}
