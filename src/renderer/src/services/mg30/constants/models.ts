export const MODEL_BASE_DICT = {
  wah: {
    clyde: [],
    cryBb: [],
    v847: [],
    horseWah: [],
    octaveShift: []
  },
  compressor: {
    roseComp: ['sustain', 'level'],
    kComp: ['sustain', 'level', 'clipping'],
    studioComp: ['threshold', 'ratio', 'gain', 'release']
  },
  noiseGate: {
    noiseGate: ['sens', 'decay']
  },
  efx: {
    distortionPlus: ['output', 'distortion'],
    rcBoost: ['gain', 'volume', 'bass', 'treble'],
    acBoost: ['gain', 'volume', 'bass', 'treble'],
    distOne: ['level', 'tone', 'drive'],
    tScream: ['drive', 'tone', 'level'],
    bluesDrv: ['level', 'tone', 'gain'],
    morningDrv: ['volume', 'drive', 'tone'],
    eatDist: ['distortion', 'filter', 'volume'],
    redDirt: ['drive', 'tone', 'level'],
    crunch: ['volume', 'tone', 'gain'],
    muffFuzz: ['volume', 'tone', 'sustain'],
    katana: ['boost', 'volume'],
    stSinger: ['volume', 'gain', 'filter'],
    redFuzz: ['gain', 'tone', 'output'],
    touchWah: ['mode', 'decay', 'sens', 'up', 'level'],
    fullOdHp: ['volume', 'drive', 'tone'],
    horsemanOd: ['gain', 'treble', 'output'],
    nobPdr: ['drive', 'level', 'spectrum'],
    rivBlueflog: ['level', 'gain', 'tone'],
    turboOd: ['level', 'tone', 'drive']
  },
  amp: {
    jazzClean: ['gain', 'master', 'bass', 'middle', 'treble', 'bright', 'level'],
    deluxeRvb: ['gain', 'master', 'bass', 'middle', 'treble', 'bias', 'level'],
    bassmate: ['gain', 'master', 'bass', 'middle', 'treble', 'presence', 'bias', 'level'],
    tweedy: ['gain', 'tone', 'master', 'level'],
    twinRvb: ['gain', 'master', 'bass', 'middle', 'treble', 'bright', 'bias', 'level'],
    hiwire: ['gain', 'master', 'bass', 'middle', 'treble', 'presence', 'bias', 'level'],
    caliCrunch: ['gain', 'master', 'bass', 'middle', 'treble', 'presence', 'bias', 'level'],
    classA15: ['gain', 'master', 'cut', 'bass', 'treble', 'level'],
    classA30: ['gain', 'master', 'cut', 'bass', 'treble', 'level'],
    plexi100: ['gain', 'master', 'bass', 'middle', 'treble', 'presence', 'bias', 'level'],
    plexi45: ['gain', 'master', 'bass', 'middle', 'treble', 'presence', 'bias', 'level'],
    brit800: ['gain', 'master', 'bass', 'middle', 'treble', 'presence', 'bias', 'level'],
    '1987x50': ['gain', 'master', 'bass', 'middle', 'treble', 'presence', 'bias', 'level'],
    slo100: ['gain', 'master', 'bass', 'middle', 'treble', 'presence', 'bias', 'level'],
    firemanHbe: ['gain', 'master', 'bass', 'middle', 'treble', 'presence', 'bias', 'level'],
    dualRect: ['gain', 'master', 'bass', 'middle', 'treble', 'presence', 'bias', 'level'],
    dieVh4: ['gain', 'master', 'bass', 'middle', 'treble', 'presence', 'bias', 'level'],
    vibKing: ['gain', 'master', 'bass', 'middle', 'treble', 'presence', 'bias', 'level'],
    budda: ['gain', 'master', 'cut', 'bass', 'middle', 'treble', 'level'],
    mrZ38: ['gain', 'master', 'cut', 'bass', 'middle', 'treble', 'level'],
    superRvb: ['gain', 'master', 'bass', 'middle', 'treble', 'bright', 'bias', 'level'],
    britBlues: ['gain', 'master', 'bass', 'middle', 'treble', 'presence', 'bias', 'level'],
    match: ['gain', 'master', 'cut', 'bass', 'treble', 'level'],
    brit2000: ['gain', 'master', 'bass', 'middle', 'treble', 'presence', 'bias', 'level'],
    uber: ['gain', 'master', 'bass', 'middle', 'treble', 'presence', 'bias', 'level'],
    agl: ['gain', 'master', 'bass', 'middle', 'mFreq', 'treble', 'level'],
    bassguy: ['gain', 'master', 'bass', 'middle', 'treble', 'presence', 'level'],
    mld: ['gain', 'master', 'bass', 'middle', 'mFreq', 'treble', 'level'],
    optimaAir: ['gain', 'master', 'bass', 'middle', 'treble', 'level'],
    stageman: ['gain', 'master', 'bass', 'middle', 'treble', 'level'],
    dglass: ['master', 'bass', 'unknown', 'loMids', 'hiMids', 'unknown', 'treble', 'level'],
    starlift: ['bass', 'middle', 'mFreq', 'treble', 'contour', 'volume', 'level'],
    vivo: ['gain', 'master', 'bass', 'middle', 'treble', 'presence', 'bias', 'level'],
    princeton: ['volume', 'treble', 'bass', 'bias', 'level'],
    lStar: ['gain', 'master', 'bass', 'middle', 'treble', 'presence', 'bias', 'level']
  },
  ir: {
    irCabinet: {
      jz120: {
        parameter: ['levelIr', 'lowCut', 'highCut'],
        hasMic: true
      },
      dr112: {
        parameter: ['levelIr', 'lowCut', 'highCut'],
        hasMic: true
      },
      bs410: {
        parameter: ['levelIr', 'lowCut', 'highCut'],
        hasMic: true
      },
      a212: {
        parameter: ['levelIr', 'lowCut', 'highCut'],
        hasMic: true
      },
      tr212: {
        parameter: ['levelIr', 'lowCut', 'highCut'],
        hasMic: true
      },
      '1960': {
        parameter: ['levelIr', 'lowCut', 'highCut'],
        hasMic: true
      },
      gb412: {
        parameter: ['levelIr', 'lowCut', 'highCut'],
        hasMic: true
      },
      v412: {
        parameter: ['levelIr', 'lowCut', 'highCut'],
        hasMic: true
      },
      aglDb810: {
        parameter: ['levelIr', 'lowCut', 'highCut'],
        hasMic: false
      },
      ampSv810: {
        parameter: ['levelIr', 'lowCut', 'highCut'],
        hasMic: false
      },
      ampSv410: {
        parameter: ['levelIr', 'lowCut', 'highCut'],
        hasMic: false
      },
      ampSv212: {
        parameter: ['levelIr', 'lowCut', 'highCut'],
        hasMic: false
      },
      mkb410: {
        parameter: ['levelIr', 'lowCut', 'highCut'],
        hasMic: false
      },
      trc410: {
        parameter: ['levelIr', 'lowCut', 'highCut'],
        hasMic: false
      },
      eden410: {
        parameter: ['levelIr', 'lowCut', 'highCut'],
        hasMic: false
      },
      bassguy410: {
        parameter: ['levelIr', 'lowCut', 'highCut'],
        hasMic: false
      },
      mD45: {
        parameter: ['levelIr', 'lowCut', 'highCut'],
        hasMic: false
      },
      gHbird: {
        parameter: ['levelIr', 'lowCut', 'highCut'],
        hasMic: false
      },
      gJ15: {
        parameter: ['levelIr', 'lowCut', 'highCut'],
        hasMic: false
      },
      swampThang: {
        parameter: ['levelIr', 'lowCut', 'highCut'],
        hasMic: false
      },
      cannabisRex12: {
        parameter: ['levelIr', 'lowCut', 'highCut'],
        hasMic: false
      },
      legend1058: {
        parameter: ['levelIr', 'lowCut', 'highCut'],
        hasMic: false
      },
      cv75: {
        parameter: ['levelIr', 'lowCut', 'highCut'],
        hasMic: false
      }
    },
    irMicType: {
      dyn421: [],
      s57: [],
      u87: [],
      r122: [],
      r121: [],
      c414: [],
      c3000: [],
      b52: []
    },
    irMicPosition: {
      center: [],
      middle: [],
      edge: []
    }
  },
  eq: {
    '6BandEq': ['100', '220', '500', '1200', '2600', '6400', 'levelEq'],
    alignEq: ['hpf', '110', '340', '660', '1300', '2600', '5000', 'volume'],
    '10BandEq': [
      'volumeEq10',
      '31.25',
      '62.5',
      '125',
      '250',
      '500',
      '1000',
      '2000',
      '4000',
      '8000',
      '16000',
      'gainEq10'
    ],
    paraEq: [
      'band1Freq',
      'band1Gain',
      'band1Q',
      'band2Freq',
      'band2Gain',
      'band2Q',
      'band3Freq',
      'band3Gain',
      'band3Q'
    ]
  },
  mod: {
    ce1: ['inten', 'depth', 'rate', 'subD'],
    ce2: ['rate', 'depth'],
    stChorus: ['inten', 'width', 'rate', 'subD'],
    vibrator: ['rate', 'depth', 'subD'],
    detune: ['shiftL', 'mix', 'shiftR'],
    flanger: ['level', 'rate', 'width', 'feedback'],
    phase90: ['speed', 'subD'],
    phase100: ['inten', 'speed', 'subD'],
    scf: ['speed', 'width', 'chFl', 'inten'],
    uVibe: ['speed', 'volume', 'inten', 'chVib'],
    tremolo: ['rate', 'depth', 'subD'],
    rotarySpeaker: ['balance', 'speed', 'subD'],
    harmonist: ['key', 'minorMajor', 'harmo', 'blend'],
    sch1: ['rate', 'depth', 'tone', 'subD'],
    suoctave: ['sub', 'dry', 'up']
  },
  delay: {
    analogDelay: ['rate', 'echo', 'inten', 'subD'],
    digitalDelay: ['eLevel', 'feedback', 'dTime', 'subD'],
    modulation: ['time', 'level', 'mod', 'repeat', 'subD'],
    tapeEcho: ['time', 'level', 'repeat', 'subD'],
    reverse: ['time', 'mix', 'feedback', 'subD'],
    panDelay: ['time', 'repeat', 'dLevel', 'subD'],
    duotime: ['level', 'time1', 'subD1', 'repeat1', 'time2', 'subD2', 'repeat2', 'para'],
    phiDelay: ['mix', 'repeat', 'time', 'subD']
  },
  reverb: {
    room: ['decay', 'tone', 'level'],
    hall: ['decay', 'predelay', 'liveliness', 'level'],
    plate: ['decay', 'level'],
    spring: ['decay', 'level'],
    shimmer: ['mix', 'decay', 'shimmer'],
    damp: ['mix', 'depth']
  }
}
