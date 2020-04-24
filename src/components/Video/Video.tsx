import React, { Component, RefObject } from 'react';
import { Video as ExpoVideo, VideoProps } from 'expo-av';
import { View } from 'react-native';

type Props = VideoProps & ({
  source: VideoProps['source'];
} | {
  srcObject: MediaStream
});

type Source = {}

export class Video extends Component<Props> {

  videoRef: RefObject<any>;

  constructor(props: Props) {
    super(props);

    this.videoRef = React.createRef();    
  }

  componentDidMount() {
    this.setSrcObject();
  }

  componentDidUpdate() {
    this.setSrcObject();
  }

  setSrcObject() {
    if ('srcObject' in this.props && this.videoRef.current) {
      this.videoRef.current.srcObject = this.props.srcObject;
    }
  }
  
  render() {

    // const { source, srcObject } = this.props;

    return (
      // <ExpoVideo
      //   ref={this.videoRef} 
      //   source={this.props.srcObject}
      //   {...this.props}
      // />
      <View style={this.props.style}>
        <video
          autoPlay
          muted={this.props.isMuted}
          playsInline
          ref={this.videoRef}
          style={{width: '100%'}}
          // {...this.props}
        />
      </View>
    )
  }
}