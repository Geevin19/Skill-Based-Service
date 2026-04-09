import { useEffect, useRef, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSocket } from '../../context/SocketContext';
import { useAuth } from '../../context/AuthContext';
import api from '../../utils/api';
import { FiMic, FiMicOff, FiVideo, FiVideoOff, FiPhoneOff, FiMonitor } from 'react-icons/fi';
import toast from 'react-hot-toast';

const ICE_SERVERS = { iceServers: [{ urls: 'stun:stun.l.google.com:19302' }] };

export default function VideoCall() {
  const { bookingId } = useParams();
  const { socket } = useSocket();
  const { user } = useAuth();
  const navigate = useNavigate();

  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const pcRef = useRef(null);
  const localStreamRef = useRef(null);

  const [booking, setBooking] = useState(null);
  const [connected, setConnected] = useState(false);
  const [muted, setMuted] = useState(false);
  const [videoOff, setVideoOff] = useState(false);
  const [remoteId, setRemoteId] = useState(null);

  useEffect(() => {
    api.get(`/bookings/${bookingId}`).then(res => {
      setBooking(res.data);
      const other = res.data.learner_id === user?.id ? res.data.mentor_id : res.data.learner_id;
      setRemoteId(other);
    });
  }, [bookingId]);

  useEffect(() => {
    if (!socket || !remoteId) return;

    const startCall = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        localStreamRef.current = stream;
        if (localVideoRef.current) localVideoRef.current.srcObject = stream;

        pcRef.current = new RTCPeerConnection(ICE_SERVERS);
        stream.getTracks().forEach(t => pcRef.current.addTrack(t, stream));

        pcRef.current.ontrack = (e) => {
          if (remoteVideoRef.current) remoteVideoRef.current.srcObject = e.streams[0];
          setConnected(true);
        };

        pcRef.current.onicecandidate = (e) => {
          if (e.candidate) socket.emit('webrtc_ice_candidate', { target: remoteId, candidate: e.candidate });
        };

        const offer = await pcRef.current.createOffer();
        await pcRef.current.setLocalDescription(offer);
        socket.emit('webrtc_offer', { target: remoteId, offer });
      } catch (err) {
        toast.error('Could not access camera/microphone');
      }
    };

    socket.on('webrtc_offer', async ({ from, offer }) => {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      localStreamRef.current = stream;
      if (localVideoRef.current) localVideoRef.current.srcObject = stream;

      pcRef.current = new RTCPeerConnection(ICE_SERVERS);
      stream.getTracks().forEach(t => pcRef.current.addTrack(t, stream));
      pcRef.current.ontrack = (e) => {
        if (remoteVideoRef.current) remoteVideoRef.current.srcObject = e.streams[0];
        setConnected(true);
      };
      pcRef.current.onicecandidate = (e) => {
        if (e.candidate) socket.emit('webrtc_ice_candidate', { target: from, candidate: e.candidate });
      };

      await pcRef.current.setRemoteDescription(offer);
      const answer = await pcRef.current.createAnswer();
      await pcRef.current.setLocalDescription(answer);
      socket.emit('webrtc_answer', { target: from, answer });
    });

    socket.on('webrtc_answer', async ({ answer }) => {
      await pcRef.current?.setRemoteDescription(answer);
    });

    socket.on('webrtc_ice_candidate', async ({ candidate }) => {
      await pcRef.current?.addIceCandidate(candidate);
    });

    startCall();

    return () => {
      localStreamRef.current?.getTracks().forEach(t => t.stop());
      pcRef.current?.close();
      socket.off('webrtc_offer');
      socket.off('webrtc_answer');
      socket.off('webrtc_ice_candidate');
    };
  }, [socket, remoteId]);

  const toggleMute = () => {
    const track = localStreamRef.current?.getAudioTracks()[0];
    if (track) { track.enabled = !track.enabled; setMuted(!muted); }
  };

  const toggleVideo = () => {
    const track = localStreamRef.current?.getVideoTracks()[0];
    if (track) { track.enabled = !track.enabled; setVideoOff(!videoOff); }
  };

  const shareScreen = async () => {
    try {
      const screen = await navigator.mediaDevices.getDisplayMedia({ video: true });
      const sender = pcRef.current?.getSenders().find(s => s.track?.kind === 'video');
      sender?.replaceTrack(screen.getTracks()[0]);
    } catch { toast.error('Screen share cancelled'); }
  };

  const endCall = () => {
    localStreamRef.current?.getTracks().forEach(t => t.stop());
    pcRef.current?.close();
    navigate('/bookings');
  };

  return (
    <div className="min-h-screen bg-gray-900 flex flex-col">
      <div className="flex-1 relative">
        {/* Remote video */}
        <video ref={remoteVideoRef} autoPlay playsInline
          className="w-full h-full object-cover"
          style={{ minHeight: 'calc(100vh - 80px)' }} />

        {!connected && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center text-white">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4" />
              <p>Connecting to session...</p>
            </div>
          </div>
        )}

        {/* Local video PiP */}
        <div className="absolute bottom-24 right-4 w-40 h-28 rounded-xl overflow-hidden border-2 border-white shadow-lg">
          <video ref={localVideoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
        </div>
      </div>

      {/* Controls */}
      <div className="bg-gray-800 px-6 py-4 flex items-center justify-center gap-4">
        <button onClick={toggleMute}
          className={`w-12 h-12 rounded-full flex items-center justify-center transition-colors
            ${muted ? 'bg-red-600 text-white' : 'bg-gray-600 text-white hover:bg-gray-500'}`}>
          {muted ? <FiMicOff size={18} /> : <FiMic size={18} />}
        </button>
        <button onClick={toggleVideo}
          className={`w-12 h-12 rounded-full flex items-center justify-center transition-colors
            ${videoOff ? 'bg-red-600 text-white' : 'bg-gray-600 text-white hover:bg-gray-500'}`}>
          {videoOff ? <FiVideoOff size={18} /> : <FiVideo size={18} />}
        </button>
        <button onClick={shareScreen} className="w-12 h-12 rounded-full bg-gray-600 text-white flex items-center justify-center hover:bg-gray-500">
          <FiMonitor size={18} />
        </button>
        <button onClick={endCall} className="w-14 h-14 rounded-full bg-red-600 text-white flex items-center justify-center hover:bg-red-700">
          <FiPhoneOff size={20} />
        </button>
      </div>
    </div>
  );
}
