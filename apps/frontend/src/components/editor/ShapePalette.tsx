import { useMemo, useState } from 'react';
import {
  Search, X, GripVertical, Smartphone, Tablet, MapPin, Map, Navigation,
  Lock, Shield, Key, Fingerprint, Activity, BarChart3, LineChart, PieChart,
  LayoutDashboard, MessageSquare, Mail, Video, Smartphone as PhoneIcon,
  Image as ImageIcon, Video as VideoIcon, Music, Camera, Database, Server,
  Cloud, Github, GitBranch, Container, Box, Monitor, HardDrive, FileCode,
  Settings, Globe, Wifi, Bluetooth, Battery, Zap, Bell, Search as SearchIcon,
  Filter, Plus, Minus, X as XIcon, Check, AlertCircle, Info, HelpCircle,
  User, Users, UserPlus, UserMinus, Heart, Star, ThumbsUp, ThumbsDown,
  Bookmark, Flag, Tag, Folder, File, FileText, FileImage, FileVideo,
  Calendar, Clock, Timer, Watch, Sun, Moon, Cloud as CloudIcon,
  CloudRain, Wind, Thermometer, Droplets, Flame, Snowflake,
  Home, Building, Factory, Warehouse, Store, School, Banknote,
  CreditCard, Wallet, Receipt, ShoppingCart, ShoppingBag, Package, Truck,
  Car, Bus, Train, Plane, Ship, Rocket, Anchor, Compass, Crosshair,
  Target, Flag as FlagIcon, Award, Trophy, Medal, Crown, Gem,
  Briefcase, PenTool, Paintbrush, Palette, Code, Terminal, GitCommit,
  Layers, Grid, Table, Columns, Rows, Maximize, Minimize as MinimizeIcon,
  Move, RotateCcw, RefreshCw, Repeat, Shuffle, SortAsc, SortDesc, List,
  AlignLeft, AlignCenter, AlignRight, AlignJustify, Bold, Italic, Underline,
  Strikethrough, Link, Paperclip, Scissors, Copy, Clipboard, ClipboardCheck,
  Trash2, Archive, ArchiveRestore, Save, Download, Upload,
  Share2, ExternalLink, ExternalLink as ExternalLinkIcon, ChevronLeft,
  ChevronRight, ChevronUp, ChevronDown, ChevronsLeft, ChevronsRight,
  ChevronsUp, ChevronsDown, ArrowLeft, ArrowRight, ArrowUp, ArrowDown,
  ArrowUpLeft, ArrowUpRight, ArrowDownLeft, ArrowDownRight, CornerUpLeft,
  CornerUpRight, CornerDownLeft, CornerDownRight, Maximize2, Minimize2,
  Sliders, ToggleLeft, ToggleRight, Radio, CheckCircle, XCircle, AlertTriangle,
  HelpCircle as HelpCircleIcon, Info as InfoIcon, Bell as BellIcon,
  MessageCircle, MessagesSquare, Phone, PhoneCall, PhoneForwarded, PhoneIncoming,
  PhoneMissed, PhoneOff, PhoneOutgoing, Video as VideoCall, Mic, MicOff,
  Volume, Volume1, Volume2, VolumeX, Headphones, Speaker, Cast, Airplay,
  MonitorPlay, Tv, Projector, ScreenShare, Smartphone as MobileIcon,
  Tablet as TabletIcon, Laptop, Computer, Cpu, HardDrive as HDD,
  MemoryStick, Disc, Usb, Wifi as WifiIcon, Bluetooth as BTIcon,
  Battery as BatteryIcon, BatteryCharging, BatteryFull, BatteryLow,
  BatteryMedium, BatteryWarning, Power, PowerOff, Plug, Zap as ZapIcon,
  Cable, Gauge, Activity as Pulse, Waves, Dna, Atom, Orbit, Sparkles,
  Lightbulb, Flashlight, Lamp, Sun as SunIcon, Moon as MoonIcon,
  Cloudy, CloudFog, CloudLightning, CloudMoon, CloudSun, Haze,
  Tornado, FireExtinguisher,
  Siren, Megaphone, Speaker as SpeakerIcon,
  Headphones as HeadphonesIcon, Headset, Watch as WatchIcon, Glasses,
  Shirt, ShoppingBag as BagIcon, Tag as TagIcon,
  Ticket, Gift, GiftIcon, Trophy as TrophyIcon, Award as AwardIcon,
  Medal as MedalIcon, Crown as CrownIcon, Star as StarIcon,
  ThumbsUp as LikeIcon, ThumbsDown as DislikeIcon, Heart as HeartIcon,
  MessageSquare as ChatIcon, MessageCircle as CommentIcon, Send,
  Share, Share2 as ShareIcon, Link as LinkIcon, Paperclip as ClipIcon,
  Hash, AtSign, DollarSign, Euro, PoundSterling, JapaneseYen, RussianRuble,
  IndianRupee, Bitcoin, CreditCard as CardIcon, Wallet as WalletIcon,
  Banknote as CashIcon, Receipt as ReceiptIcon, File as FileIcon,
  FileText as DocIcon, FileCode as CodeFileIcon, FileJson, FileType,
  FileSpreadsheet, FilePieChart, FileBarChart, Folder as FolderIcon,
  FolderOpen, FolderClosed, Folders, FolderTree, FolderClock,
  Archive as ArchiveIcon, Trash as TrashIcon, Recycle, Scissors as CutIcon,
  Copy as CopyIcon, Clipboard as ClipboardIcon, ClipboardList, ClipboardPaste,
  ClipboardType, ClipboardX, StickyNote, Sticker, Square, CheckSquare, SquareDot, MinusSquare, PlusSquare, SquareSlash,
  RectangleHorizontal, RectangleVertical, Triangle, Circle, Pentagon,
  Hexagon, Octagon, Star as StarShape, Heart as HeartShape, Diamond,
  Gem as GemShape, Crown as CrownShape, Medal as MedalShape, Award as AwardShape,
  Trophy as TrophyShape, Flag as FlagShape,
  Bookmark as BookmarkIcon, BookOpen, Book, BookX, BookCheck, BookMarked,
  Library, GraduationCap, School as SchoolIcon, Building as BuildingIcon,
  Building2, Home as HomeIcon, Warehouse as WarehouseIcon, Store as StoreIcon,
  StoreIcon as ShopIcon, Factory as FactoryIcon,
  Hotel, Castle, Church, Landmark,
  Palmtree, TreePine, TreeDeciduous, Trees, Flower, Flower2, Leaf,
  Clover, Cherry, Citrus, Banana, Apple, Grape, Wheat, Carrot,
  Cookie, Croissant, Beef, Fish, Egg, Milk, Wine, Beer, Coffee,
  CupSoda, IceCream, Pizza, Sandwich, Soup, Utensils, UtensilsCrossed,
  ChefHat, Armchair, Bed, Bath, ShowerHead, LampFloor,
  LampCeiling, LampWallDown, LampDesk, Fan, AirVent, Thermometer as TempIcon,
  Heater, WashingMachine, Fan as FanIcon, AirVent as VentIcon,
  Wind as WindIcon, Waves as WavesIcon, Droplets as WaterIcon, ThermometerSnowflake,
  ThermometerSun, Flame as FireIcon, Snowflake as SnowIcon, Cloud as CloudyIcon,
  CloudRain as RainIcon, CloudLightning as LightningIcon,
  CloudFog as FogIcon, Moon as NightIcon, Sun as DayIcon, Sunrise, Sunset,
  SunMoon, Star as NightStar, Sparkles as SparkleIcon, Zap as Lightning,
  Battery as BatIcon, BatteryCharging as ChargingIcon, BatteryFull as FullBat,
  BatteryLow as LowBat, BatteryMedium as MedBat, BatteryWarning as BatWarn,
  Power as PowerIcon, PowerOff as OffIcon, Plug as PlugIcon, Cable as CableIcon,
  Usb as USBIcon, Wifi as WifiSignal, Bluetooth as BluetoothIcon,
  Radio as RadioIcon, Antenna, Satellite, SatelliteDish, Radar, Scan,
  ScanLine, ScanSearch, ScanFace, ScanEye, ScanText, Fingerprint as FPIcon,
  Touchpad, Mouse, MousePointer, MousePointer2, MousePointerClick,
  Pointer, Grab, Hand, HandMetal, HelpingHand, ThumbsUp as ThumbUp,
  ThumbsDown as ThumbDown, Smile, Frown, Meh, Laugh, Annoyed,
  Angry, ScanFace as Dizzy, Ghost, Skull, Bot, BotMessageSquare, BotIcon as RobotIcon,
  Brain, BrainCircuit, BrainCog, Cpu as CPUIcon, HardDrive as HardDisk,
  MemoryStick as RAM, Disc as DiscIcon, Database as DBIcon, Server as ServerIcon,
  ServerCog, ServerCrash, ServerOff, Cloud as CloudServer, CloudCog,
  CloudRainWind, CloudSunRain,
  CloudMoonRain, CloudLightning as StormIcon, Tornado as TornadoIcon,
  Snowflake as SnowIcon2, Flame as Fire,
  Droplet, Droplets as RainDrops, Waves as WaveIcon, Wind as Breeze,
  Thermometer as ThermoIcon, Gauge as GaugeIcon,
  Activity as PulseIcon, Heart as HeartBeat, Stethoscope, Syringe,
  Pill, Tablet as PillIcon, Thermometer as TempMeter,
  Microscope, FlaskConical, FlaskRound, TestTube, Dna as DNAIcon,
  Atom as AtomIcon, Orbit as OrbitIcon, Rocket as RocketIcon, Satellite as SatIcon,
  Radar as RadarIcon, Scan as ScanIcon, Siren as SirenIcon, Megaphone as MegaIcon,
  Speaker as SpeakerIcon2, Headset as HeadphonesIcon2,
  Watch as SmartWatch, Glasses as Spectacles,
  Tablet as TabletDevice, Laptop as LaptopIcon,
  Computer as Desktop, Monitor as MonitorIcon, Tv as TVIcon, Projector as ProjIcon,
  ScreenShare as ShareScreen, Cast as CastIcon, Airplay as AirPlayIcon,
  Mouse as MouseIcon, MousePointer as Cursor, MousePointer2 as Cursor2,
  Pointer as PointerIcon, Grab as GrabIcon, Hand as HandIcon, HandMetal as Fist,
  HelpingHand as HelpHand,
  Smile as Happy, Frown as Sad, Meh as Neutral, Laugh as Laughing,
  Annoyed as AnnoyedIcon, Angry as AngryIcon, ScanFace as DizzyIcon,
  Ghost as GhostIcon, Skull as SkullIcon, Bot as BotIcon2, BotMessageSquare as ChatBot,
  Brain as BrainIcon, BrainCircuit as BrainChip, BrainCog as BrainGear,
  Cpu as Processor, HardDrive as Storage, MemoryStick as Memory,
  Disc as Disk, Database as DataIcon, Server as Host, ServerCog as HostSettings,
  ServerCrash as HostDown, ServerOff as HostOffline,
  CloudCog as CloudSettings, Download as CloudDL, Upload as CloudUL,
  CloudRainWind as Storm, CloudSunRain as SunRain,
  CloudMoonRain as MoonRain, CloudLightning as Thunder, Tornado as Cyclone,
  Snowflake as Frost, Flame as Blaze, Droplet as Drop,
  Droplets as Drops, Waves as Ocean, Wind as Air, Tornado as Whirlwind,
  Thermometer as ThermometerIcon, Gauge as Meter, Activity as Lifeline,
  Heart as PulseHeart, Stethoscope as DocTool, Syringe as Needle,
  Pill as CapPill, Pill as Meds,
  Thermometer as Temp, Microscope as Scope, FlaskConical as Flask,
  FlaskRound as Beaker, TestTube as Tube, Dna as Gene, Atom as Particle,
  Orbit as Path, Rocket as Launch, Satellite as Sat, Radar as ScanRadar,
  Scan as Scanner, Siren as Alarm, Megaphone as Announce, Speaker as Audio,
  Headphones as Earphones, Watch as WristWatch,
  Glasses as Eyeglasses, Glasses as SunGlasses,
  Tablet as Tab, Laptop as Notebook, Computer as PC, Monitor as Screen,
  Tv as Television, Projector as Beamer, ScreenShare as CastScreen,
  Cast as Stream, Airplay as AirPlay, Mouse as PointingDevice,
  MousePointer as ArrowCursor, MousePointer2 as ArrowCursor2,
  Pointer as PointIcon, Grab as HandGrab, Hand as Palm, HandMetal as MetalHand,
  HelpingHand as Helper, Hand as RockOn, Hand as Victory,
  Smile as Grin, Frown as FrownIcon, Meh as MehIcon, Laugh as Lol,
  Annoyed as Ugh, Angry as Mad, ScanFace as Confused, Ghost as Spooky,
  Skull as Skeleton, Bot as Robot, BotMessageSquare as AIChat,
  Brain as Mind, BrainCircuit as NeuralNet, BrainCog as Thinking,
  Cpu as Chip, HardDrive as HDDIcon, MemoryStick as RAMIcon,
  Disc as CD, Database as DB, ServerCog as ConfigServer,
  ServerCrash as Crash, ServerOff as Offline,
  CloudCog as CloudConfig, Download as DownloadCloud,
  Upload as UploadCloud, CloudRainWind as WindyRain,
  CloudSunRain as PartlyRainy, CloudMoonRain as NightRain,
  CloudLightning as LightningStorm, Tornado as TornadoWind,
  Snowflake as Snow,
  Droplet as WaterDrop, Droplets as Rain, Waves as Sea, Wind as BreezeIcon,
  Thermometer as TempIcon2, Gauge as Speedometer, Activity as Heartbeat,
  Heart as Love, Stethoscope as Doctor, Syringe as Injection,
  Pill as Drug, Pill as TabletMed, Pill as Drugs,
  Microscope as LabScope, FlaskConical as Erlenmeyer, FlaskRound as RoundFlask,
  TestTube as LabTube, Dna as Genetics, Atom as Atomic, Orbit as Orbital,
  Rocket as SpaceShip, Satellite as SpaceSat, Radar as ScannerRadar
} from 'lucide-react';
import { cn } from '@/lib/utils';

export type ShapePaletteItem = {
  id: string;
  label: string;
  nodeKind?: 'node' | 'decision' | 'startend' | 'database' | 'entity' | 'actor' | 'queue' | 'io' | 'document' | 'delay' | 'storage' | 'manual' | 'display' | 'preparation' | 'loop' | 'ui' | 'cloud' | 'security' | 'mobile' | 'analytics' | 'user' | 'notification' | 'payment' | 'communication' | 'file' | 'media' | 'location' | 'time' | 'resizableShape';
  defaultNodeLabel?: string;
  snippet: string;
  category: 'flowchart' | 'erd' | 'connectors' | 'extras' | 'ui' | 'cloud' | 'security' | 'mobile' | 'analytics' | 'communication' | 'media' | 'location' | 'basicshapes';
  shape?: 'rectangle' | 'circle' | 'rounded';
  width?: number;
  height?: number;
  fillColor?: string;
  strokeColor?: string;
  description?: string;
  icon?: string;
  color?: string;
};

const ITEMS: ShapePaletteItem[] = [
  // Basic Shapes (Resizable)
  {
    id: 'rect',
    label: 'Rectangle',
    nodeKind: 'resizableShape',
    defaultNodeLabel: 'Rectangle',
    snippet: '',
    category: 'basicshapes',
    shape: 'rectangle',
    width: 120,
    height: 80,
    fillColor: '#ffffff',
    strokeColor: '#000000',
    description: 'Resizable rectangle with editable text',
  },
  {
    id: 'circle',
    label: 'Circle',
    nodeKind: 'resizableShape',
    defaultNodeLabel: 'Circle',
    snippet: '',
    category: 'basicshapes',
    shape: 'circle',
    width: 100,
    height: 100,
    fillColor: '#ffffff',
    strokeColor: '#000000',
    description: 'Resizable circle with editable text',
  },
  {
    id: 'rounded',
    label: 'Rounded Rect',
    nodeKind: 'resizableShape',
    defaultNodeLabel: 'Rounded',
    snippet: '',
    category: 'basicshapes',
    shape: 'rounded',
    width: 120,
    height: 80,
    fillColor: '#ffffff',
    strokeColor: '#000000',
    description: 'Resizable rounded rectangle with editable text',
  },
  // Flowchart
  {
    id: 'start',
    label: 'Terminator',
    nodeKind: 'startend',
    defaultNodeLabel: 'Start',
    snippet: '(Start)',
    category: 'flowchart',
    description: 'Start / end pill',
  },
  {
    id: 'proc',
    label: 'Process',
    nodeKind: 'node',
    defaultNodeLabel: 'Process',
    snippet: '[Process]',
    category: 'flowchart',
    description: 'Rectangle task',
  },
  {
    id: 'decision',
    label: 'Decision',
    nodeKind: 'decision',
    defaultNodeLabel: 'Decision?',
    snippet: '{Decision?}',
    category: 'flowchart',
    description: 'Diamond branch',
  },
  {
    id: 'data',
    label: 'Data I/O',
    nodeKind: 'io',
    defaultNodeLabel: 'Read Data',
    snippet: '[Read Data]',
    category: 'flowchart',
    description: 'Parallelogram-style I/O (set type after insert or drag)',
  },
  {
    id: 'note',
    label: 'Note',
    nodeKind: 'node',
    defaultNodeLabel: 'Note',
    snippet: '[Note]',
    category: 'flowchart',
    description: 'Annotation box',
  },
  {
    id: 'document',
    label: 'Document',
    nodeKind: 'document',
    defaultNodeLabel: 'Report',
    snippet: '{{Report}}',
    category: 'flowchart',
    description: 'Document with curved bottom',
  },
  {
    id: 'delay',
    label: 'Delay',
    nodeKind: 'delay',
    defaultNodeLabel: 'Wait',
    snippet: '(/Wait/)',
    category: 'flowchart',
    description: 'Half-circle delay symbol',
  },
  {
    id: 'storage',
    label: 'Storage',
    nodeKind: 'storage',
    defaultNodeLabel: 'Data Store',
    snippet: '[(Data Store)]',
    category: 'flowchart',
    description: 'D-shaped storage symbol',
  },
  {
    id: 'manual',
    label: 'Manual Input',
    nodeKind: 'manual',
    defaultNodeLabel: 'User Input',
    snippet: '[[User Input]]',
    category: 'flowchart',
    description: 'Slanted rectangle',
  },
  {
    id: 'display',
    label: 'Display',
    nodeKind: 'display',
    defaultNodeLabel: 'Output',
    snippet: '(/Output/)',
    category: 'flowchart',
    description: 'Right-pointing output',
  },
  {
    id: 'preparation',
    label: 'Preparation',
    nodeKind: 'preparation',
    defaultNodeLabel: 'Setup',
    snippet: '[[Setup]]',
    category: 'flowchart',
    description: 'Hexagon preparation',
  },
  {
    id: 'loop',
    label: 'Loop Limit',
    nodeKind: 'loop',
    defaultNodeLabel: 'Loop',
    snippet: '[Loop]',
    category: 'flowchart',
    description: 'Pill with sideways brackets',
  },
  // Data / ER-style (drag keeps shape; code uses [[ ]] for DB)
  {
    id: 'db',
    label: 'Database',
    nodeKind: 'database',
    defaultNodeLabel: 'PostgreSQL',
    snippet: '[[PostgreSQL]]',
    category: 'erd',
    description: 'Cylinder storage (syntax: [[Name]])',
  },
  {
    id: 'entity',
    label: 'Entity',
    nodeKind: 'entity',
    defaultNodeLabel: 'Users',
    snippet: 'Users[Name\nEmail]',
    category: 'erd',
    description: 'ER table header - drag for shape, or set type in properties',
  },
  {
    id: 'actor',
    label: 'Actor / System',
    nodeKind: 'actor',
    defaultNodeLabel: 'Payment API',
    snippet: '[Payment API]',
    category: 'erd',
    description: 'External actor or bounded context',
  },
  {
    id: 'queue',
    label: 'Queue / Topic',
    nodeKind: 'queue',
    defaultNodeLabel: 'Orders topic',
    snippet: '[Orders topic]',
    category: 'erd',
    description: 'Message queue or event stream',
  },
  {
    id: 'cache',
    label: 'Cache',
    nodeKind: 'database',
    defaultNodeLabel: 'Redis',
    snippet: '[[Redis]]',
    category: 'erd',
    description: 'Fast cache (same cylinder as DB)',
  },
  {
    id: 'api',
    label: 'Service',
    nodeKind: 'node',
    defaultNodeLabel: 'REST API',
    snippet: '[REST API]',
    category: 'erd',
    description: 'Application service box',
  },
  {
    id: 'lambda',
    label: 'Function',
    nodeKind: 'node',
    defaultNodeLabel: 'Lambda',
    snippet: '[Lambda Function]',
    category: 'erd',
    description: 'Serverless function',
  },
  {
    id: 'cdn',
    label: 'CDN',
    nodeKind: 'node',
    defaultNodeLabel: 'CloudFront',
    snippet: '[CloudFront]',
    category: 'erd',
    description: 'Content delivery network',
  },
  {
    id: 'lb',
    label: 'Load Balancer',
    nodeKind: 'node',
    defaultNodeLabel: 'ALB',
    snippet: '[ALB]',
    category: 'erd',
    description: 'Load balancer',
  },
  {
    id: 'firewall',
    label: 'Firewall',
    nodeKind: 'node',
    defaultNodeLabel: 'WAF',
    snippet: '[WAF]',
    category: 'erd',
    description: 'Web application firewall',
  },
  // Connectors
  {
    id: 'edge',
    label: 'Arrow',
    snippet: '[A] --> [B]',
    category: 'connectors',
    description: 'Simple connection',
  },
  {
    id: 'labeled',
    label: 'Labeled',
    snippet: '[A] -- label --> [B]',
    category: 'connectors',
    description: 'Edge with label',
  },
  {
    id: 'bidirect',
    label: 'Bidirect',
    snippet: '[A] <--> [B]',
    category: 'connectors',
    description: 'Two-way arrow',
  },
  {
    id: 'step',
    label: 'Step',
    snippet: '[A] -| [B]',
    category: 'connectors',
    description: 'Right-angle edge',
  },
  {
    id: 'dotted',
    label: 'Dotted',
    snippet: '[A] -.-> [B]',
    category: 'connectors',
    description: 'Dotted connection',
  },
  {
    id: 'thick',
    label: 'Thick',
    snippet: '[A] ==> [B]',
    category: 'connectors',
    description: 'Thick arrow',
  },
  {
    id: 'async',
    label: 'Async',
    snippet: '[A] -->> [B]',
    category: 'connectors',
    description: 'Async/dashed open arrow',
  },
  {
    id: 'fork',
    label: 'Fork',
    snippet: '[A] --> [B]\n[A] --> [C]',
    category: 'connectors',
    description: 'Split to multiple targets',
  },
  {
    id: 'join',
    label: 'Join',
    snippet: '[A] --> [C]\n[B] --> [C]',
    category: 'connectors',
    description: 'Merge multiple sources',
  },
  // Extras / templates
  {
    id: 'mini',
    label: 'Quick Flow',
    snippet:
      '[Step 1] --> [Step 2]\n[Step 2] --> {Ok?}\n{Ok?} -- Yes --> (End)\n{Ok?} -- No --> [Step 1]',
    category: 'extras',
    description: 'Mini template',
  },
  {
    id: 'crud',
    label: 'CRUD API',
    snippet:
      '[Client] --> [API Gateway]\n[API Gateway] --> [Auth]\n[API Gateway] --> [CRUD Service]\n[CRUD Service] --> [[PostgreSQL]]',
    category: 'extras',
    description: 'REST + database',
  },
  {
    id: 'erd-starter',
    label: 'ERD starter',
    snippet:
      '%% Entity Relationship Diagram\nUsers[id\nname\nemail]\nPosts[id\ntitle\nbody]\nUsers -- authors --> Posts',
    category: 'extras',
    description: 'App → DB with entity boxes',
  },
  {
    id: 'auth-flow',
    label: 'Auth Flow',
    snippet:
      '[Login Page] --> {Valid?}\n{Valid?} -- Yes --> [Dashboard]\n{Valid?} -- No --> [Error Message]\n[Error Message] --> [Login Page]',
    category: 'extras',
    description: 'User authentication flow',
  },
  {
    id: 'microservices',
    label: 'Microservices',
    snippet:
      '[API Gateway] --> [Auth Service]\n[API Gateway] --> [User Service]\n[API Gateway] --> [Order Service]\n[Auth Service] --> [[Redis]]\n[User Service] --> [[PostgreSQL]]\n[Order Service] --> [[MongoDB]]',
    category: 'extras',
    description: 'Microservices architecture',
  },
  {
    id: 'event-driven',
    label: 'Event-Driven',
    snippet:
      '[Producer] --> [Event Bus]\n[Event Bus] --> [Consumer A]\n[Event Bus] --> [Consumer B]\n[Event Bus] --> [DLQ]',
    category: 'extras',
    description: 'Event-driven with message queue',
  },
  {
    id: 'cache-layer',
    label: 'Cache Pattern',
    snippet:
      '[App] --> {Cache Hit?}\n{Cache Hit?} -- Yes --> [Return Data]\n{Cache Hit?} -- No --> [Database]\n[Database] --> [Update Cache]\n[Update Cache] --> [Return Data]',
    category: 'extras',
    description: 'Cache-aside pattern flow',
  },
  // UI Components - NEW
  {
    id: 'button',
    label: 'Button',
    nodeKind: 'ui',
    defaultNodeLabel: 'Click Me',
    snippet: '[Button]',
    category: 'ui',
    description: 'UI button element',
  },
  {
    id: 'input',
    label: 'Input Field',
    nodeKind: 'ui',
    defaultNodeLabel: 'Input',
    snippet: '[Input]',
    category: 'ui',
    description: 'Text input field',
  },
  {
    id: 'card',
    label: 'Card',
    nodeKind: 'ui',
    defaultNodeLabel: 'Card',
    snippet: '{{Card}}',
    category: 'ui',
    description: 'Content card container',
  },
  {
    id: 'modal',
    label: 'Modal/Dialog',
    nodeKind: 'ui',
    defaultNodeLabel: 'Modal',
    snippet: '(Modal)',
    category: 'ui',
    description: 'Popup modal window',
  },
  {
    id: 'navbar',
    label: 'Navigation',
    nodeKind: 'ui',
    defaultNodeLabel: 'NavBar',
    snippet: '[NavBar]',
    category: 'ui',
    description: 'Top navigation bar',
  },
  {
    id: 'sidebar-nav',
    label: 'Sidebar',
    nodeKind: 'ui',
    defaultNodeLabel: 'Sidebar',
    snippet: '[[Sidebar]]',
    category: 'ui',
    description: 'Side navigation panel',
  },
  {
    id: 'avatar',
    label: 'User Avatar',
    nodeKind: 'ui',
    defaultNodeLabel: 'User',
    snippet: '(User)',
    category: 'ui',
    description: 'User profile avatar',
  },
  {
    id: 'badge',
    label: 'Badge/Tag',
    nodeKind: 'ui',
    defaultNodeLabel: 'Badge',
    snippet: '(Badge)',
    category: 'ui',
    description: 'Status badge or tag',
  },
  {
    id: 'toggle',
    label: 'Toggle/Switch',
    nodeKind: 'ui',
    defaultNodeLabel: 'Toggle',
    snippet: '{Toggle?}',
    category: 'ui',
    description: 'On/off toggle switch',
  },
  // Cloud & DevOps - NEW
  {
    id: 'docker',
    label: 'Docker',
    nodeKind: 'cloud',
    defaultNodeLabel: 'Docker',
    snippet: '[Docker]',
    category: 'cloud',
    description: 'Docker container',
  },
  {
    id: 'kubernetes',
    label: 'Kubernetes',
    nodeKind: 'cloud',
    defaultNodeLabel: 'K8s',
    snippet: '[Kubernetes]',
    category: 'cloud',
    description: 'Kubernetes cluster',
  },
  {
    id: 'aws',
    label: 'AWS',
    nodeKind: 'cloud',
    defaultNodeLabel: 'AWS',
    snippet: '[AWS]',
    category: 'cloud',
    description: 'Amazon Web Services',
  },
  {
    id: 'azure',
    label: 'Azure',
    nodeKind: 'cloud',
    defaultNodeLabel: 'Azure',
    snippet: '[Azure]',
    category: 'cloud',
    description: 'Microsoft Azure',
  },
  {
    id: 'gcp',
    label: 'GCP',
    nodeKind: 'cloud',
    defaultNodeLabel: 'GCP',
    snippet: '[GCP]',
    category: 'cloud',
    description: 'Google Cloud Platform',
  },
  {
    id: 'github',
    label: 'GitHub',
    nodeKind: 'cloud',
    defaultNodeLabel: 'GitHub',
    snippet: '[GitHub]',
    category: 'cloud',
    description: 'GitHub repository',
  },
  {
    id: 'git',
    label: 'Git Branch',
    nodeKind: 'cloud',
    defaultNodeLabel: 'Git',
    snippet: '{Branch?}',
    category: 'cloud',
    description: 'Git branching',
  },
  {
    id: 'ci-cd',
    label: 'CI/CD',
    nodeKind: 'cloud',
    defaultNodeLabel: 'Pipeline',
    snippet: '[CI/CD]',
    category: 'cloud',
    description: 'CI/CD pipeline',
  },
  {
    id: 'terraform',
    label: 'IaC',
    nodeKind: 'cloud',
    defaultNodeLabel: 'Terraform',
    snippet: '[Terraform]',
    category: 'cloud',
    description: 'Infrastructure as Code',
  },
  {
    id: 'monitoring',
    label: 'Monitoring',
    nodeKind: 'cloud',
    defaultNodeLabel: 'Metrics',
    snippet: '[[Monitoring]]',
    category: 'cloud',
    description: 'Monitoring/observability',
  },
  {
    id: 'log',
    label: 'Logs',
    nodeKind: 'cloud',
    defaultNodeLabel: 'Logs',
    snippet: '[Logs]',
    category: 'cloud',
    description: 'Log aggregation',
  },
  // Security - NEW
  {
    id: 'lock',
    label: 'Lock/Secure',
    nodeKind: 'security',
    defaultNodeLabel: 'Secure',
    snippet: '[Secure]',
    category: 'security',
    description: 'Security/encryption',
  },
  {
    id: 'shield',
    label: 'Shield',
    nodeKind: 'security',
    defaultNodeLabel: 'Shield',
    snippet: '((Shield))',
    category: 'security',
    description: 'Protection shield',
  },
  {
    id: 'key',
    label: 'API Key',
    nodeKind: 'security',
    defaultNodeLabel: 'API Key',
    snippet: '[API Key]',
    category: 'security',
    description: 'API authentication',
  },
  {
    id: 'oauth',
    label: 'OAuth',
    nodeKind: 'security',
    defaultNodeLabel: 'OAuth',
    snippet: '[OAuth]',
    category: 'security',
    description: 'OAuth flow',
  },
  {
    id: 'jwt',
    label: 'JWT',
    nodeKind: 'security',
    defaultNodeLabel: 'Token',
    snippet: '[JWT]',
    category: 'security',
    description: 'JSON Web Token',
  },
  {
    id: 'vault',
    label: 'Secrets',
    nodeKind: 'security',
    defaultNodeLabel: 'Vault',
    snippet: '[[Vault]]',
    category: 'security',
    description: 'Secrets management',
  },
  // Mobile - NEW
  {
    id: 'smartphone',
    label: 'Phone',
    nodeKind: 'mobile',
    defaultNodeLabel: 'Mobile',
    snippet: '[Mobile]',
    category: 'mobile',
    description: 'Smartphone device',
  },
  {
    id: 'tablet',
    label: 'Tablet',
    nodeKind: 'mobile',
    defaultNodeLabel: 'Tablet',
    snippet: '[Tablet]',
    category: 'mobile',
    description: 'Tablet device',
  },
  {
    id: 'touch',
    label: 'Touch Gesture',
    nodeKind: 'mobile',
    defaultNodeLabel: 'Tap',
    snippet: '(Touch)',
    category: 'mobile',
    description: 'Touch interaction',
  },
  {
    id: 'notification-mobile',
    label: 'Push Notif',
    nodeKind: 'mobile',
    defaultNodeLabel: 'Push',
    snippet: '(Push)',
    category: 'mobile',
    description: 'Mobile push notification',
  },
  {
    id: 'biometric',
    label: 'Biometric',
    nodeKind: 'mobile',
    defaultNodeLabel: 'FaceID',
    snippet: '[FaceID]',
    category: 'mobile',
    description: 'Biometric auth',
  },
  // Analytics - NEW
  {
    id: 'chart-bar',
    label: 'Bar Chart',
    nodeKind: 'analytics',
    defaultNodeLabel: 'Chart',
    snippet: '[Bar Chart]',
    category: 'analytics',
    description: 'Bar chart visualization',
  },
  {
    id: 'chart-line',
    label: 'Line Chart',
    nodeKind: 'analytics',
    defaultNodeLabel: 'Trend',
    snippet: '[Line Chart]',
    category: 'analytics',
    description: 'Line trend chart',
  },
  {
    id: 'chart-pie',
    label: 'Pie Chart',
    nodeKind: 'analytics',
    defaultNodeLabel: 'Pie',
    snippet: '(Pie Chart)',
    category: 'analytics',
    description: 'Pie/donut chart',
  },
  {
    id: 'dashboard',
    label: 'Dashboard',
    nodeKind: 'analytics',
    defaultNodeLabel: 'Dashboard',
    snippet: '[Dashboard]',
    category: 'analytics',
    description: 'Analytics dashboard',
  },
  {
    id: 'metric',
    label: 'Metric/KPI',
    nodeKind: 'analytics',
    defaultNodeLabel: 'KPI',
    snippet: '[KPI]',
    category: 'analytics',
    description: 'Key performance indicator',
  },
  // Communication - NEW
  {
    id: 'chat',
    label: 'Chat',
    nodeKind: 'communication',
    defaultNodeLabel: 'Messages',
    snippet: '[Chat]',
    category: 'communication',
    description: 'Chat messages',
  },
  {
    id: 'email',
    label: 'Email',
    nodeKind: 'communication',
    defaultNodeLabel: 'Email',
    snippet: '[Email]',
    category: 'communication',
    description: 'Email/letter',
  },
  {
    id: 'video-call',
    label: 'Video',
    nodeKind: 'communication',
    defaultNodeLabel: 'Video',
    snippet: '[Video Call]',
    category: 'communication',
    description: 'Video conference',
  },
  {
    id: 'sms',
    label: 'SMS/Text',
    nodeKind: 'communication',
    defaultNodeLabel: 'SMS',
    snippet: '[SMS]',
    category: 'communication',
    description: 'Text message',
  },
  // Media - NEW
  {
    id: 'image',
    label: 'Image',
    nodeKind: 'media',
    defaultNodeLabel: 'Image',
    snippet: '[Image]',
    category: 'media',
    description: 'Image/picture',
  },
  {
    id: 'video',
    label: 'Video',
    nodeKind: 'media',
    defaultNodeLabel: 'Video',
    snippet: '[Video]',
    category: 'media',
    description: 'Video player',
  },
  {
    id: 'audio',
    label: 'Audio',
    nodeKind: 'media',
    defaultNodeLabel: 'Audio',
    snippet: '[Audio]',
    category: 'media',
    description: 'Audio/sound',
  },
  {
    id: 'camera',
    label: 'Camera',
    nodeKind: 'media',
    defaultNodeLabel: 'Camera',
    snippet: '[Camera]',
    category: 'media',
    description: 'Camera/photo',
  },
  // Location - NEW
  {
    id: 'location',
    label: 'Location',
    nodeKind: 'location',
    defaultNodeLabel: 'Pin',
    snippet: '(Location)',
    category: 'location',
    description: 'Map location pin',
  },
  {
    id: 'map',
    label: 'Map',
    nodeKind: 'location',
    defaultNodeLabel: 'Map',
    snippet: '[[Map]]',
    category: 'location',
    description: 'Map/geography',
  },
  {
    id: 'gps',
    label: 'GPS',
    nodeKind: 'location',
    defaultNodeLabel: 'GPS',
    snippet: '[GPS]',
    category: 'location',
    description: 'GPS tracking',
  },
  {
    id: 'directions',
    label: 'Route',
    nodeKind: 'location',
    defaultNodeLabel: 'Route',
    snippet: '[Route]',
    category: 'location',
    description: 'Directions/route',
  },
];

const CATEGORIES = [
  { key: 'flowchart' as const, label: 'Flowchart' },
  { key: 'ui' as const, label: 'UI Components' },
  { key: 'cloud' as const, label: 'Cloud & DevOps' },
  { key: 'security' as const, label: 'Security' },
  { key: 'mobile' as const, label: 'Mobile' },
  { key: 'analytics' as const, label: 'Analytics' },
  { key: 'communication' as const, label: 'Communication' },
  { key: 'media' as const, label: 'Media' },
  { key: 'location' as const, label: 'Location' },
  { key: 'erd' as const, label: 'Data & ER' },
  { key: 'connectors' as const, label: 'Connectors' },
  { key: 'extras' as const, label: 'Templates' },
];

interface ShapePaletteProps {
  onInsert: (snippet: string) => void;
}

export function ShapePalette({ onInsert }: ShapePaletteProps) {
  const [q, setQ] = useState('');
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return ITEMS;
    return ITEMS.filter(
      (i) =>
        i.label.toLowerCase().includes(s) ||
        i.category.toLowerCase().includes(s) ||
        i.description?.toLowerCase().includes(s)
    );
  }, [q]);

  const byCat = (cat: ShapePaletteItem['category']) => filtered.filter((i) => i.category === cat);
  const toggle = (key: string) => setCollapsed((o) => ({ ...o, [key]: !o[key] }));

  return (
    <div className="h-full flex flex-col bg-[#18181b] border-r border-[#27272a]">
      {/* Header */}
      <div className="shrink-0 border-b border-[#27272a] px-3 pt-4 pb-3 space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-black uppercase tracking-[0.15em] text-[#71717a]">
            Shape Library
          </span>
          <span className="flex h-1.5 w-1.5 rounded-full bg-white animate-pulse" />
        </div>

        {/* Search */}
        <div className="relative group">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#52525b] group-focus-within:text-white transition-colors pointer-events-none" />
          <input
            type="search"
            placeholder="Filter shapes..."
            value={q}
            onChange={(e) => setQ(e.target.value)}
            className="
              w-full pl-8 pr-8 py-2 text-[11px] font-medium rounded-lg
              border border-[#3f3f46] bg-[#27272a]
              placeholder:text-[#71717a] text-white
              focus:outline-none focus:border-white focus:ring-1 focus:ring-white/20
              transition-all
            "
            aria-label="Search diagram elements"
          />
          {q && (
            <button
              type="button"
              onClick={() => setQ('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#71717a] hover:text-white transition-colors"
            >
              <X className="w-3 h-3" />
            </button>
          )}
        </div>
      </div>

      {/* Shape groups */}
      <div className="flex-1 overflow-y-auto py-2 custom-scrollbar">
        {CATEGORIES.map(({ key, label }) => {
          const items = byCat(key);
          if (!items.length) return null;
          const isOpen = !collapsed[key];

          return (
            <div key={key} className="mb-1">
              {/* Category header */}
              <button
                type="button"
                onClick={() => toggle(key)}
                className="w-full flex items-center justify-between px-3 py-2 group hover:bg-[#27272a] transition-colors"
              >
                <span className="text-[10px] font-black uppercase tracking-[0.12em] text-[#71717a] group-hover:text-white transition-colors">
                  {label}
                </span>
                <div
                  className={cn(
                    'w-4 h-4 flex items-center justify-center rounded text-[#52525b] group-hover:text-white transition-all',
                    isOpen && 'rotate-90'
                  )}
                >
                  <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                    <path d="M3 1.5L6.5 5L3 8.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>
              </button>

              {isOpen && (
                <div className="px-2 pb-2 grid grid-cols-2 gap-1.5 animate-in fade-in slide-in-from-top-1 duration-150">
                  {items.map((item) => (
                    <ShapeCard
                      key={item.id}
                      item={item}
                      onInsert={onInsert}
                    />
                  ))}
                </div>
              )}
            </div>
          );
        })}

        {filtered.length === 0 && (
          <div className="flex flex-col items-center justify-center py-10 gap-2 text-center px-4">
            <Search className="w-7 h-7 text-[#3f3f46]" />
            <p className="text-[11px] font-bold text-[#71717a] uppercase tracking-wider">
              No matches
            </p>
            <p className="text-[10px] text-[#52525b]">Try a different keyword</p>
          </div>
        )}
      </div>

      {/* Footer hint */}
      <div className="shrink-0 border-t border-[#27272a] px-3 py-2">
        <p className="text-[9px] text-[#52525b] text-center font-medium">
          Click to insert · Drag to canvas
        </p>
      </div>
    </div>
  );
}

// Ã¢â€â‚¬Ã¢â€â‚¬ Shape Card Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬

// Map shape IDs to Lucide icons
const SHAPE_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  // UI
  'button': Box,
  'input': SearchIcon,
  'card': LayoutDashboard,
  'modal': Maximize2,
  'navbar': MenuIcon,
  'sidebar-nav': PanelLeft,
  'avatar': User,
  'badge': Tag,
  'toggle': ToggleRight,
  // Cloud & DevOps
  'docker': Container,
  'kubernetes': Layers,
  'aws': Cloud,
  'azure': Cloud,
  'gcp': Cloud,
  'github': Github,
  'git': GitBranch,
  'ci-cd': RefreshCw,
  'terraform': Settings,
  'monitoring': Activity,
  'log': FileText,
  // Security
  'lock': Lock,
  'shield': Shield,
  'key': Key,
  'oauth': Globe,
  'jwt': Fingerprint,
  'vault': Database,
  // Mobile
  'smartphone': PhoneIcon,
  'tablet': Tablet,
  'touch': MousePointer,
  'notification-mobile': Bell,
  'biometric': Fingerprint,
  // Analytics
  'chart-bar': BarChart3,
  'chart-line': LineChart,
  'chart-pie': PieChart,
  'dashboard': LayoutDashboard,
  'metric': Target,
  // Communication
  'chat': MessageSquare,
  'email': Mail,
  'video-call': VideoIcon,
  'sms': MessageCircle,
  // Media
  'image': ImageIcon,
  'video': VideoIcon,
  'audio': Music,
  'camera': Camera,
  // Location
  'location': MapPin,
  'map': Map,
  'gps': Navigation,
  'directions': ArrowRight,
};

// Menu icon component (not in lucide)
function MenuIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 48 48" className={className} aria-hidden>
      <line x1="8" y1="14" x2="40" y2="14" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
      <line x1="8" y1="24" x2="40" y2="24" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
      <line x1="8" y1="34" x2="40" y2="34" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
}

// Panel left icon (sidebar)
function PanelLeft({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 48 48" className={className} aria-hidden>
      <rect x="4" y="4" width="40" height="40" rx="2" fill="none" stroke="currentColor" strokeWidth="2" />
      <line x1="16" y1="4" x2="16" y2="44" stroke="currentColor" strokeWidth="2" />
    </svg>
  );
}

function ShapeCard({ item, onInsert }: { item: ShapePaletteItem; onInsert: (s: string) => void }) {
  const IconComponent = SHAPE_ICONS[item.id];
  
  return (
    <button
      type="button"
      onClick={() => onInsert(item.snippet)}
      draggable
      onDragStart={(e) => {
        e.dataTransfer.effectAllowed = 'copy';
        // Derive color from category
        const categoryColors: Record<string, string> = {
          'ui': '#3b82f6',           // Blue
          'cloud': '#10b981',        // Green
          'security': '#ef4444',     // Red
          'mobile': '#8b5cf6',       // Purple
          'analytics': '#f59e0b',    // Amber
          'communication': '#0ea5e9', // Sky
          'media': '#ec4899',        // Pink
          'location': '#22c55e',     // Green
          'flowchart': '#c99367',    // Tan
          'erd': '#a78bfa',          // Purple
          'connectors': '#94a3b8',   // Gray
          'extras': '#64748b',       // Slate
          'basicshapes': '#64748b',  // Slate
        };
        e.dataTransfer.setData(
          'application/x-diagram-snippet',
          JSON.stringify({
            kind: item.nodeKind,
            label: item.defaultNodeLabel || item.label,
            snippet: item.snippet,
            color: item.color || categoryColors[item.category] || '#ffffff',
            icon: item.icon || item.id,
            id: item.id,
            shape: item.shape,
            width: item.width,
            height: item.height,
            fillColor: item.fillColor,
            strokeColor: item.strokeColor,
          })
        );
      }}
      title={item.description}
      className="
        group relative flex flex-col items-center justify-center gap-1.5
        aspect-square rounded-xl border border-[#3f3f46] bg-[#27272a]
        hover:border-white/30 hover:bg-[#3f3f46] hover:shadow-lg hover:shadow-white/5
        transition-all duration-200 hover:-translate-y-0.5 active:translate-y-0 active:scale-95
        p-2 select-none cursor-grab active:cursor-grabbing
      "
    >
      {/* Drag handle indicator */}
      <GripVertical className="absolute top-1.5 left-1.5 w-2.5 h-2.5 text-[#52525b] group-hover:text-white/30 transition-colors" />

      <div className="flex-1 flex items-center justify-center w-full">
        {IconComponent ? (
          <IconComponent className="w-9 h-9 text-white drop-shadow-sm" />
        ) : (
          <ShapeThumb id={item.id} />
        )}
      </div>

      <span className="text-[9px] font-black text-[#71717a] group-hover:text-white uppercase tracking-tight transition-colors text-center leading-none">
        {item.label}
      </span>
    </button>
  );
}

// Ã¢â€â‚¬Ã¢â€â‚¬ Shape Thumbnails Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬

function ShapeThumb({ id }: { id: string }) {
  const stroke = '#ffffff';
  const fill = 'rgba(255,255,255,0.08)';

  switch (id) {
    case 'decision':
      return (
        <svg viewBox="0 0 48 48" className="w-9 h-9 drop-shadow-sm" aria-hidden>
          <polygon
            points="24,7 41,24 24,41 7,24"
            fill={fill}
            stroke={stroke}
            strokeWidth="1.5"
            strokeLinejoin="round"
          />
        </svg>
      );

    case 'start':
      return (
        <svg viewBox="0 0 48 48" className="w-9 h-9 drop-shadow-sm" aria-hidden>
          <rect x="7" y="15" width="34" height="18" rx="9" fill={fill} stroke={stroke} strokeWidth="1.5" />
        </svg>
      );

    case 'db':
    case 'cache':
      return (
        <svg viewBox="0 0 48 48" className="w-9 h-9 drop-shadow-sm" aria-hidden>
          <path d="M8,13 C8,9 40,9 40,13 L40,35 C40,39 8,39 8,35 Z" fill={fill} stroke={stroke} strokeWidth="1.5" />
          <path d="M8,13 C8,17 40,17 40,13" fill="none" stroke={stroke} strokeWidth="1.5" />
          <path d="M8,19 C8,23 40,23 40,19" fill="none" stroke={stroke} strokeWidth="1" opacity="0.4" />
        </svg>
      );

    case 'entity':
      return (
        <svg viewBox="0 0 48 48" className="w-9 h-9 drop-shadow-sm" aria-hidden>
          <rect x="6" y="10" width="36" height="30" rx="3" fill={fill} stroke={stroke} strokeWidth="1.5" />
          <rect x="6" y="10" width="36" height="11" rx="3" fill={stroke} opacity="0.35" />
          <line x1="6" y1="21" x2="42" y2="21" stroke={stroke} strokeWidth="1.2" />
        </svg>
      );

    case 'actor':
      return (
        <svg viewBox="0 0 48 48" className="w-9 h-9 drop-shadow-sm" aria-hidden>
          <rect x="8" y="12" width="32" height="26" rx="4" fill={fill} stroke={stroke} strokeWidth="1.5" strokeDasharray="4 3" />
          <circle cx="24" cy="22" r="4" fill="none" stroke={stroke} strokeWidth="1.2" />
        </svg>
      );

    case 'queue':
      return (
        <svg viewBox="0 0 48 48" className="w-9 h-9 drop-shadow-sm" aria-hidden>
          <rect x="10" y="12" width="28" height="24" rx="3" fill={fill} stroke={stroke} strokeWidth="1.5" />
          <line x1="12" y1="16" x2="14" y2="32" stroke={stroke} strokeWidth="2" opacity="0.35" />
          <line x1="17" y1="16" x2="19" y2="32" stroke={stroke} strokeWidth="2" opacity="0.35" />
        </svg>
      );

    case 'api':
      return (
        <svg viewBox="0 0 48 48" className="w-9 h-9 drop-shadow-sm" aria-hidden>
          <rect x="8" y="14" width="32" height="20" rx="4" fill={fill} stroke={stroke} strokeWidth="1.5" />
          <path d="M16 24h16M24 20v8" stroke={stroke} strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      );

    case 'data':
      return (
        <svg viewBox="0 0 48 48" className="w-9 h-9 drop-shadow-sm" aria-hidden>
          <polygon points="13,14 40,14 35,34 8,34" fill={fill} stroke={stroke} strokeWidth="1.5" />
        </svg>
      );

    case 'note':
      return (
        <svg viewBox="0 0 48 48" className="w-9 h-9 drop-shadow-md" aria-hidden>
          <path
            d="M10,10 L38,10 L38,30 L30,38 L10,38 Z"
            fill={fill}
            stroke={stroke}
            strokeWidth="1.5"
          />
          <path d="M30,38 L30,30 L38,30" fill="none" stroke={stroke} strokeWidth="1.2" />
          <line x1="15" y1="20" x2="32" y2="20" stroke={stroke} strokeWidth="1" opacity="0.4" />
          <line x1="15" y1="26" x2="28" y2="26" stroke={stroke} strokeWidth="1" opacity="0.4" />
        </svg>
      );

    // UI Components - NEW
    case 'button':
      return (
        <svg viewBox="0 0 48 48" className="w-9 h-9 drop-shadow-sm" aria-hidden>
          <rect x="6" y="16" width="36" height="16" rx="4" fill={fill} stroke={stroke} strokeWidth="1.5" />
          <rect x="10" y="20" width="28" height="8" rx="2" fill="rgba(255,255,255,0.2)" />
        </svg>
      );

    case 'input':
      return (
        <svg viewBox="0 0 48 48" className="w-9 h-9 drop-shadow-sm" aria-hidden>
          <rect x="6" y="14" width="36" height="20" rx="3" fill={fill} stroke={stroke} strokeWidth="1.5" />
          <line x1="12" y1="24" x2="24" y2="24" stroke={stroke} strokeWidth="1.5" strokeDasharray="2 2" opacity="0.6" />
          <rect x="28" y="18" width="12" height="12" rx="2" fill="none" stroke={stroke} strokeWidth="1" opacity="0.3" />
        </svg>
      );

    case 'card':
      return (
        <svg viewBox="0 0 48 48" className="w-9 h-9 drop-shadow-sm" aria-hidden>
          <rect x="8" y="8" width="32" height="32" rx="4" fill={fill} stroke={stroke} strokeWidth="1.5" />
          <rect x="12" y="12" width="24" height="8" rx="2" fill="rgba(255,255,255,0.15)" />
          <line x1="12" y1="26" x2="32" y2="26" stroke={stroke} strokeWidth="1" opacity="0.4" />
          <line x1="12" y1="32" x2="28" y2="32" stroke={stroke} strokeWidth="1" opacity="0.4" />
        </svg>
      );

    case 'modal':
      return (
        <svg viewBox="0 0 48 48" className="w-9 h-9 drop-shadow-sm" aria-hidden>
          <rect x="4" y="4" width="40" height="40" rx="4" fill="rgba(0,0,0,0.3)" />
          <rect x="10" y="12" width="28" height="24" rx="3" fill={fill} stroke={stroke} strokeWidth="1.5" />
          <line x1="14" y1="18" x2="34" y2="18" stroke={stroke} strokeWidth="1.2" />
        </svg>
      );

    case 'navbar':
      return (
        <svg viewBox="0 0 48 48" className="w-9 h-9 drop-shadow-sm" aria-hidden>
          <rect x="4" y="8" width="40" height="32" rx="2" fill={fill} stroke={stroke} strokeWidth="1.5" />
          <rect x="8" y="12" width="32" height="8" rx="1" fill="rgba(255,255,255,0.2)" />
          <circle cx="14" cy="30" r="3" fill="rgba(255,255,255,0.2)" />
          <circle cx="24" cy="30" r="3" fill="rgba(255,255,255,0.2)" />
          <circle cx="34" cy="30" r="3" fill="rgba(255,255,255,0.2)" />
        </svg>
      );

    case 'sidebar-nav':
      return (
        <svg viewBox="0 0 48 48" className="w-9 h-9 drop-shadow-sm" aria-hidden>
          <rect x="4" y="4" width="40" height="40" rx="2" fill={fill} stroke={stroke} strokeWidth="1.5" />
          <rect x="8" y="8" width="10" height="32" rx="1" fill="rgba(255,255,255,0.15)" />
          <line x1="22" y1="12" x2="38" y2="12" stroke={stroke} strokeWidth="1" opacity="0.4" />
          <line x1="22" y1="20" x2="38" y2="20" stroke={stroke} strokeWidth="1" opacity="0.4" />
          <line x1="22" y1="28" x2="38" y2="28" stroke={stroke} strokeWidth="1" opacity="0.4" />
        </svg>
      );

    case 'avatar':
      return (
        <svg viewBox="0 0 48 48" className="w-9 h-9 drop-shadow-sm" aria-hidden>
          <circle cx="24" cy="18" r="10" fill={fill} stroke={stroke} strokeWidth="1.5" />
          <path d="M12 38 Q24 28 36 38" fill="none" stroke={stroke} strokeWidth="1.5" />
        </svg>
      );

    case 'badge':
      return (
        <svg viewBox="0 0 48 48" className="w-9 h-9 drop-shadow-sm" aria-hidden>
          <rect x="10" y="16" width="28" height="16" rx="8" fill={fill} stroke={stroke} strokeWidth="1.5" />
          <circle cx="18" cy="24" r="3" fill="rgba(255,255,255,0.3)" />
        </svg>
      );

    case 'toggle':
      return (
        <svg viewBox="0 0 48 48" className="w-9 h-9 drop-shadow-sm" aria-hidden>
          <rect x="8" y="16" width="32" height="16" rx="8" fill={fill} stroke={stroke} strokeWidth="1.5" />
          <circle cx="28" cy="24" r="5" fill={stroke} opacity="0.6" />
        </svg>
      );

    // Cloud & DevOps - NEW
    case 'docker':
    case 'kubernetes':
    case 'ci-cd':
      return (
        <svg viewBox="0 0 48 48" className="w-9 h-9 drop-shadow-sm" aria-hidden>
          <rect x="10" y="10" width="28" height="28" rx="4" fill={fill} stroke={stroke} strokeWidth="1.5" />
          <rect x="14" y="20" width="8" height="8" rx="1" fill="rgba(255,255,255,0.2)" />
          <rect x="26" y="20" width="8" height="8" rx="1" fill="rgba(255,255,255,0.2)" />
        </svg>
      );

    case 'aws':
    case 'azure':
    case 'gcp':
      return (
        <svg viewBox="0 0 48 48" className="w-9 h-9 drop-shadow-sm" aria-hidden>
          <path d="M10 30 L24 12 L38 30 Z" fill={fill} stroke={stroke} strokeWidth="1.5" />
          <circle cx="24" cy="24" r="6" fill="rgba(255,255,255,0.2)" />
        </svg>
      );

    case 'github':
    case 'git':
      return (
        <svg viewBox="0 0 48 48" className="w-9 h-9 drop-shadow-sm" aria-hidden>
          <circle cx="24" cy="24" r="14" fill={fill} stroke={stroke} strokeWidth="1.5" />
          <path d="M24 14 L24 24 L30 30" fill="none" stroke={stroke} strokeWidth="2" strokeLinecap="round" />
          <circle cx="24" cy="14" r="2" fill={stroke} />
          <circle cx="24" cy="24" r="2" fill={stroke} />
          <circle cx="30" cy="30" r="2" fill={stroke} />
        </svg>
      );

    case 'terraform':
    case 'monitoring':
      return (
        <svg viewBox="0 0 48 48" className="w-9 h-9 drop-shadow-sm" aria-hidden>
          <rect x="8" y="24" width="6" height="16" rx="1" fill={fill} stroke={stroke} strokeWidth="1.2" />
          <rect x="21" y="16" width="6" height="24" rx="1" fill={fill} stroke={stroke} strokeWidth="1.2" />
          <rect x="34" y="28" width="6" height="12" rx="1" fill={fill} stroke={stroke} strokeWidth="1.2" />
        </svg>
      );

    case 'log':
      return (
        <svg viewBox="0 0 48 48" className="w-9 h-9 drop-shadow-sm" aria-hidden>
          <rect x="6" y="6" width="36" height="36" rx="2" fill={fill} stroke={stroke} strokeWidth="1.5" />
          <line x1="12" y1="14" x2="36" y2="14" stroke={stroke} strokeWidth="1" opacity="0.5" />
          <line x1="12" y1="22" x2="32" y2="22" stroke={stroke} strokeWidth="1" opacity="0.5" />
          <line x1="12" y1="30" x2="28" y2="30" stroke={stroke} strokeWidth="1" opacity="0.5" />
          <line x1="12" y1="38" x2="34" y2="38" stroke={stroke} strokeWidth="1" opacity="0.5" />
        </svg>
      );

    // Security - NEW
    case 'lock':
      return (
        <svg viewBox="0 0 48 48" className="w-9 h-9 drop-shadow-sm" aria-hidden>
          <rect x="12" y="20" width="24" height="20" rx="2" fill={fill} stroke={stroke} strokeWidth="1.5" />
          <path d="M14 20 V14 A10 10 0 0 1 34 14 V20" fill="none" stroke={stroke} strokeWidth="1.5" />
          <circle cx="24" cy="30" r="3" fill="rgba(255,255,255,0.3)" />
        </svg>
      );

    case 'shield':
      return (
        <svg viewBox="0 0 48 48" className="w-9 h-9 drop-shadow-sm" aria-hidden>
          <path d="M24 6 L40 12 V22 Q40 34 24 42 Q8 34 8 22 V12 Z" fill={fill} stroke={stroke} strokeWidth="1.5" />
          <path d="M18 24 L22 28 L30 18" fill="none" stroke={stroke} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );

    case 'key':
      return (
        <svg viewBox="0 0 48 48" className="w-9 h-9 drop-shadow-sm" aria-hidden>
          <circle cx="16" cy="24" r="10" fill={fill} stroke={stroke} strokeWidth="1.5" />
          <circle cx="16" cy="24" r="4" fill={stroke} opacity="0.3" />
          <rect x="24" y="20" width="18" height="8" rx="1" fill={fill} stroke={stroke} strokeWidth="1.5" />
        </svg>
      );

    case 'oauth':
    case 'jwt':
      return (
        <svg viewBox="0 0 48 48" className="w-9 h-9 drop-shadow-sm" aria-hidden>
          <circle cx="24" cy="24" r="16" fill={fill} stroke={stroke} strokeWidth="1.5" />
          <path d="M24 16 V24 L30 30" fill="none" stroke={stroke} strokeWidth="2" strokeLinecap="round" />
        </svg>
      );

    case 'vault':
      return (
        <svg viewBox="0 0 48 48" className="w-9 h-9 drop-shadow-sm" aria-hidden>
          <rect x="8" y="8" width="32" height="32" rx="2" fill={fill} stroke={stroke} strokeWidth="1.5" />
          <circle cx="24" cy="24" r="6" fill="rgba(255,255,255,0.2)" />
          <line x1="24" y1="24" x2="24" y2="20" stroke={stroke} strokeWidth="1.5" />
        </svg>
      );

    // Mobile - NEW
    case 'smartphone':
    case 'tablet':
      return (
        <svg viewBox="0 0 48 48" className="w-9 h-9 drop-shadow-sm" aria-hidden>
          <rect x="14" y="4" width="20" height="40" rx="3" fill={fill} stroke={stroke} strokeWidth="1.5" />
          <rect x="17" y="8" width="14" height="28" rx="1" fill="rgba(255,255,255,0.1)" />
          <circle cx="24" cy="38" r="2" fill="rgba(255,255,255,0.3)" />
        </svg>
      );

    case 'touch':
      return (
        <svg viewBox="0 0 48 48" className="w-9 h-9 drop-shadow-sm" aria-hidden>
          <circle cx="24" cy="24" r="14" fill={fill} stroke={stroke} strokeWidth="1.5" />
          <path d="M24 14 L24 20 M24 28 L24 34 M14 24 L20 24 M28 24 L34 24" stroke={stroke} strokeWidth="2" strokeLinecap="round" />
        </svg>
      );

    case 'notification-mobile':
    case 'biometric':
      return (
        <svg viewBox="0 0 48 48" className="w-9 h-9 drop-shadow-sm" aria-hidden>
          <circle cx="24" cy="20" r="10" fill={fill} stroke={stroke} strokeWidth="1.5" />
          <path d="M18 32 L24 38 L30 32" fill="none" stroke={stroke} strokeWidth="2" strokeLinecap="round" />
        </svg>
      );

    // Analytics - NEW
    case 'chart-bar':
      return (
        <svg viewBox="0 0 48 48" className="w-9 h-9 drop-shadow-sm" aria-hidden>
          <rect x="8" y="24" width="8" height="16" rx="1" fill={fill} stroke={stroke} strokeWidth="1.2" />
          <rect x="20" y="16" width="8" height="24" rx="1" fill={fill} stroke={stroke} strokeWidth="1.2" />
          <rect x="32" y="28" width="8" height="12" rx="1" fill={fill} stroke={stroke} strokeWidth="1.2" />
        </svg>
      );

    case 'chart-line':
      return (
        <svg viewBox="0 0 48 48" className="w-9 h-9 drop-shadow-sm" aria-hidden>
          <rect x="6" y="6" width="36" height="36" rx="2" fill={fill} stroke={stroke} strokeWidth="1.2" />
          <path d="M10 34 L18 26 L26 30 L38 14" fill="none" stroke={stroke} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );

    case 'chart-pie':
      return (
        <svg viewBox="0 0 48 48" className="w-9 h-9 drop-shadow-sm" aria-hidden>
          <circle cx="24" cy="24" r="16" fill={fill} stroke={stroke} strokeWidth="1.5" />
          <path d="M24 8 L24 24 L36 36" fill="none" stroke={stroke} strokeWidth="1.5" />
        </svg>
      );

    case 'dashboard':
      return (
        <svg viewBox="0 0 48 48" className="w-9 h-9 drop-shadow-sm" aria-hidden>
          <rect x="4" y="4" width="40" height="40" rx="3" fill={fill} stroke={stroke} strokeWidth="1.5" />
          <rect x="10" y="10" width="12" height="10" rx="1" fill="rgba(255,255,255,0.2)" />
          <rect x="26" y="10" width="12" height="10" rx="1" fill="rgba(255,255,255,0.2)" />
          <rect x="10" y="24" width="28" height="14" rx="1" fill="rgba(255,255,255,0.15)" />
        </svg>
      );

    case 'metric':
      return (
        <svg viewBox="0 0 48 48" className="w-9 h-9 drop-shadow-sm" aria-hidden>
          <circle cx="24" cy="24" r="18" fill={fill} stroke={stroke} strokeWidth="1.5" />
          <text x="24" y="28" textAnchor="middle" fill={stroke} fontSize="14" fontWeight="bold">KPI</text>
        </svg>
      );

    // Communication - NEW
    case 'chat':
      return (
        <svg viewBox="0 0 48 48" className="w-9 h-9 drop-shadow-sm" aria-hidden>
          <rect x="6" y="8" width="36" height="28" rx="4" fill={fill} stroke={stroke} strokeWidth="1.5" />
          <path d="M18 36 L24 44 L30 36" fill={fill} stroke={stroke} strokeWidth="1.5" />
          <circle cx="16" cy="22" r="2" fill={stroke} opacity="0.5" />
          <circle cx="24" cy="22" r="2" fill={stroke} opacity="0.5" />
          <circle cx="32" cy="22" r="2" fill={stroke} opacity="0.5" />
        </svg>
      );

    case 'email':
      return (
        <svg viewBox="0 0 48 48" className="w-9 h-9 drop-shadow-sm" aria-hidden>
          <rect x="6" y="10" width="36" height="28" rx="2" fill={fill} stroke={stroke} strokeWidth="1.5" />
          <path d="M6 12 L24 26 L42 12" fill="none" stroke={stroke} strokeWidth="1.5" />
        </svg>
      );

    case 'video-call':
      return (
        <svg viewBox="0 0 48 48" className="w-9 h-9 drop-shadow-sm" aria-hidden>
          <rect x="6" y="12" width="28" height="24" rx="2" fill={fill} stroke={stroke} strokeWidth="1.5" />
          <path d="M38 18 L46 12 V36 L38 30 Z" fill={fill} stroke={stroke} strokeWidth="1.5" />
        </svg>
      );

    case 'sms':
      return (
        <svg viewBox="0 0 48 48" className="w-9 h-9 drop-shadow-sm" aria-hidden>
          <rect x="8" y="10" width="32" height="28" rx="4" fill={fill} stroke={stroke} strokeWidth="1.5" />
          <line x1="14" y1="20" x2="34" y2="20" stroke={stroke} strokeWidth="1.2" />
          <line x1="14" y1="28" x2="28" y2="28" stroke={stroke} strokeWidth="1.2" />
        </svg>
      );

    // Media - NEW
    case 'image':
      return (
        <svg viewBox="0 0 48 48" className="w-9 h-9 drop-shadow-sm" aria-hidden>
          <rect x="6" y="8" width="36" height="32" rx="2" fill={fill} stroke={stroke} strokeWidth="1.5" />
          <circle cx="18" cy="20" r="4" fill="rgba(255,255,255,0.2)" />
          <path d="M6 32 L18 24 L26 30 L34 22 L42 28 V36 Q42 40 38 40 H10 Q6 40 6 36 Z" fill="rgba(255,255,255,0.15)" />
        </svg>
      );

    case 'video':
      return (
        <svg viewBox="0 0 48 48" className="w-9 h-9 drop-shadow-sm" aria-hidden>
          <rect x="6" y="12" width="36" height="24" rx="2" fill={fill} stroke={stroke} strokeWidth="1.5" />
          <polygon points="20,18 32,24 20,30" fill={stroke} opacity="0.5" />
        </svg>
      );

    case 'audio':
      return (
        <svg viewBox="0 0 48 48" className="w-9 h-9 drop-shadow-sm" aria-hidden>
          <path d="M16 18 L16 30 L24 30 L32 36 V12 L24 18 Z" fill={fill} stroke={stroke} strokeWidth="1.5" />
          <path d="M36 16 Q40 20 40 24 Q40 28 36 32" fill="none" stroke={stroke} strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      );

    case 'camera':
      return (
        <svg viewBox="0 0 48 48" className="w-9 h-9 drop-shadow-sm" aria-hidden>
          <rect x="8" y="14" width="32" height="24" rx="2" fill={fill} stroke={stroke} strokeWidth="1.5" />
          <circle cx="24" cy="26" r="6" fill="none" stroke={stroke} strokeWidth="1.5" />
          <circle cx="24" cy="26" r="3" fill="rgba(255,255,255,0.3)" />
        </svg>
      );

    // Location - NEW
    case 'location':
      return (
        <svg viewBox="0 0 48 48" className="w-9 h-9 drop-shadow-sm" aria-hidden>
          <path d="M24 4 C14 4 10 14 10 20 C10 30 24 44 24 44 C24 44 38 30 38 20 C38 14 34 4 24 4 Z" fill={fill} stroke={stroke} strokeWidth="1.5" />
          <circle cx="24" cy="20" r="5" fill={stroke} opacity="0.3" />
        </svg>
      );

    case 'map':
      return (
        <svg viewBox="0 0 48 48" className="w-9 h-9 drop-shadow-sm" aria-hidden>
          <path d="M4 12 L16 8 L32 14 L44 10 V40 L32 44 L16 38 L4 42 Z" fill={fill} stroke={stroke} strokeWidth="1.5" />
          <line x1="16" y1="8" x2="16" y2="38" stroke={stroke} strokeWidth="1" opacity="0.3" />
          <line x1="32" y1="14" x2="32" y2="44" stroke={stroke} strokeWidth="1" opacity="0.3" />
        </svg>
      );

    case 'gps':
      return (
        <svg viewBox="0 0 48 48" className="w-9 h-9 drop-shadow-sm" aria-hidden>
          <circle cx="24" cy="24" r="14" fill="none" stroke={stroke} strokeWidth="1.5" strokeDasharray="4 2" />
          <circle cx="24" cy="24" r="6" fill={fill} stroke={stroke} strokeWidth="1.5" />
          <circle cx="24" cy="24" r="2" fill={stroke} />
        </svg>
      );

    case 'directions':
      return (
        <svg viewBox="0 0 48 48" className="w-9 h-9 drop-shadow-sm" aria-hidden>
          <path d="M10 38 L10 18 L24 10 L38 18 L38 38" fill={fill} stroke={stroke} strokeWidth="1.5" />
          <path d="M24 10 L24 38 M18 30 L24 38 L30 30" fill="none" stroke={stroke} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );

    case 'edge':
    case 'labeled':
    case 'bidirect':
    case 'step': {
      const isStep = id === 'step';
      const isBi = id === 'bidirect';
      return (
        <svg viewBox="0 0 48 48" className="w-9 h-9" aria-hidden>
          <defs>
            <marker id={`arrow-${id}-e`} markerWidth="6" markerHeight="6" refX="5.5" refY="3" orient="auto">
              <path d="M0,0.5 L5.5,3 L0,5.5 z" fill={stroke} />
            </marker>
            {isBi && (
              <marker id={`arrow-${id}-s`} markerWidth="6" markerHeight="6" refX="0.5" refY="3" orient="auto-start-reverse">
                <path d="M5.5,0.5 L0,3 L5.5,5.5 z" fill={stroke} />
              </marker>
            )}
          </defs>
          {isStep ? (
            <path
              d="M8 34 L28 34 L28 14 L38 14"
              stroke={stroke}
              strokeWidth="1.8"
              fill="none"
              markerEnd={`url(#arrow-${id}-e)`}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          ) : (
            <path
              d="M8 24 L38 24"
              stroke={stroke}
              strokeWidth="2"
              fill="none"
              markerEnd={`url(#arrow-${id}-e)`}
              markerStart={isBi ? `url(#arrow-${id}-s)` : undefined}
              strokeLinecap="round"
            />
          )}
          {id === 'labeled' && (
            <text
              x="24"
              y="20"
              fontSize="7"
              fill={stroke}
              textAnchor="middle"
              fontFamily="monospace"
              opacity="0.7"
            >
              label
            </text>
          )}
        </svg>
      );
    }

    case 'mini':
    case 'crud':
      return (
        <svg viewBox="0 0 48 48" className="w-9 h-9" aria-hidden>
          {/* Two stacked rects with arrow to suggest template */}
          <rect x="6" y="8" width="18" height="10" rx="3" fill={fill} stroke={stroke} strokeWidth="1.2" />
          <rect x="6" y="30" width="18" height="10" rx="3" fill={fill} stroke={stroke} strokeWidth="1.2" />
          <path d="M15 18 L15 30" stroke={stroke} strokeWidth="1.5" markerEnd="url(#arrow-template)" />
          <rect x="28" y="18" width="14" height="12" rx="3" fill={fill} stroke={stroke} strokeWidth="1.2" />
          <path d="M24 24 L28 24" stroke={stroke} strokeWidth="1.2" />
          <defs>
            <marker id="arrow-template" markerWidth="5" markerHeight="5" refX="4" refY="2.5" orient="auto">
              <path d="M0,0.5 L4.5,2.5 L0,4.5 z" fill={stroke} />
            </marker>
          </defs>
        </svg>
      );

    default:
      // Process (rectangle)
      return (
        <svg viewBox="0 0 48 48" className="w-9 h-9 drop-shadow-sm" aria-hidden>
          <rect x="9" y="15" width="30" height="18" rx="4" fill={fill} stroke={stroke} strokeWidth="1.5" />
        </svg>
      );
  }
}
