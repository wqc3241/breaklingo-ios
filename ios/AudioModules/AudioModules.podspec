Pod::Spec.new do |s|
  s.name         = "AudioModules"
  s.version      = "0.0.1"
  s.summary      = "Native audio playback and recording for BreakLingo"
  s.homepage     = "https://breaklingo.com"
  s.license      = "MIT"
  s.author       = "BreakLingo"
  s.platform     = :ios, "15.1"
  s.source       = { :path => "." }
  s.source_files = "*.{h,m}"
  s.frameworks   = "AVFoundation"
  s.dependency "React-Core"
end
