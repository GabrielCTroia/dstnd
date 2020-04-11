import React, { Component, RefObject } from 'react';
import { Video as ExpoVideo, VideoProps } from 'expo-av';

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
      <video 
        autoPlay
        // src={this.props.src}
        muted={this.props.isMuted}
        playsInline
        ref={this.videoRef}
        // {...this.props}
      />
    )
  }
}