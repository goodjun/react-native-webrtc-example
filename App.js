import React from 'react';
import {SafeAreaView, StyleSheet, View, Button} from 'react-native';
import {RTCPeerConnection, RTCSessionDescription, RTCView, mediaDevices} from 'react-native-webrtc';
import axios from 'axios';

export default function App() {
  const [localStream, setLocalStream] = React.useState();
  const [remoteStream, setRemoteStream] = React.useState();

  const apiUri = 'http://xxx.com';

  const configuration = {
    iceServers: [
      {
        urls: ['stun:xxx.xxx.xxx.xxx'],
      },
      {
        urls: ['turn:xxx.xxx.xxx.xxx'],
        username: 'user',
        credential: 'password',
      },
    ],
  };
  const localPC = new RTCPeerConnection(configuration);

  const startStream = async () => {
    const constraints = {audio: true, video: true};
    const stream = await mediaDevices.getUserMedia(constraints);
    setLocalStream(stream);
  };

  const createOffer = async () => {
    localPC.addStream(localStream);

    localPC.onicecandidate = (e) => {
      if (e.candidate) {
        console.log('candidate found.', e.candidate.candidate);
      } else {
        console.log('candidate not found.');
      }
    };

    localPC.onaddstream = (e) => {
      if (e.stream) {
        setRemoteStream(e.stream);
      }
    };

    // just to get the onicecandidates to start
    const uselessOffer = await localPC.createOffer();
    await localPC.setLocalDescription(uselessOffer);

    // we make sure all of them are registered before calling by waiting 2 second.
    setTimeout(() => {
      localPC
        .createOffer()
        .then((sdp) => localPC.setLocalDescription(sdp))
        .then(() => {
          console.log('Sent offer description.');
          createOfferDescription(localPC.localDescription);
        });
    }, 2 * 1000);
  };

  const getOffer = async () => {
    localPC.addStream(localStream);

    localPC.onicecandidate = (e) => {
      if (e.candidate) {
        console.log('Candidate found.', e.candidate.candidate);
      } else {
        console.log('Candidate not found.');
      }
    };

    localPC.onaddstream = (e) => {
      if (e.stream) {
        setRemoteStream(e.stream);
      }
    };

    // just to get the onicecandidates to start
    const offerDescription = await getOfferDescription();
    const sdp = new RTCSessionDescription(offerDescription);
    await localPC.setRemoteDescription(sdp);
    const uselessAnswer = await localPC.createAnswer();
    await localPC.setLocalDescription(uselessAnswer);

    // we make sure all of them are registered before calling by waiting 2 second.
    setTimeout(() => {
      getOfferDescription().then((offer) => {
        localPC.setRemoteDescription(new RTCSessionDescription(offer)).then(() => {
          localPC.createAnswer().then((answer) => {
            localPC.setLocalDescription(answer).then(() => {
              console.log('Sent answer description.');
              createAnswerDescription(localPC.localDescription);
            });
          });
        });
      });
    }, 2 * 1000);
  };

  const getAnswer = async () => {
    const description = await getAnswerDescription();
    console.log(description);
    await localPC.setRemoteDescription(new RTCSessionDescription(description));
  };

  const createOfferDescription = async (description) => {
    const url = `${apiUri}/rtc/offer`;
    await axios.post(url, {
      id: '1',
      description: JSON.stringify(description),
    });
  };

  const getAnswerDescription = async () => {
    const url = `${apiUri}/rtc/answer/2`;
    const result = await axios.get(url);
    return result.data;
  };

  const createAnswerDescription = async (description) => {
    const url = `${apiUri}/rtc/offer`;
    await axios.post(url, {
      id: '2',
      description: JSON.stringify(description),
    });
  };

  const getOfferDescription = async () => {
    const url = `${apiUri}/rtc/offer/1`;
    const result = await axios.get(url);
    return result.data;
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.toolbarContainer}>
        <View style={styles.buttonWrap}>
          <Button title="Click to start stream" style={styles.button} onPress={startStream} />
        </View>
        <View style={styles.buttonWrap}>
          <Button title="Click to create offer" style={styles.button} onPress={createOffer} />
        </View>
        <View style={styles.buttonWrap}>
          <Button title="Click to get answer" style={styles.button} onPress={getAnswer} />
        </View>
        <View style={styles.buttonWrap}>
          <Button title="Click to start stream" style={styles.button} color="#f194ff" onPress={startStream} />
        </View>
        <View style={styles.buttonWrap}>
          <Button title="Click to get offer" style={styles.button} color="#f194ff" onPress={getOffer} />
        </View>
      </View>
      <View style={styles.rtcContainer}>
        <View style={styles.rtcWrap}>
          {localStream && <RTCView style={styles.rtc} streamURL={localStream.toURL()} />}
        </View>
        <View style={styles.rtcWrap}>
          {remoteStream && <RTCView style={styles.rtc} streamURL={remoteStream.toURL()} />}
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#313131',
    height: '100%',
    padding: 10,
  },
  toolbarContainer: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
  },
  buttonWrap: {
    paddingLeft: 10,
  },
  rtc: {
    width: '90%',
    height: '100%',
  },
  rtcWrap: {
    flex: 1,
    alignItems: 'center',
  },
  rtcContainer: {
    flex: 1,
    flexDirection: 'row',
  },
});
