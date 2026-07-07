//
//  MusicKitModule.swift
//  WakeTune
//
//  Native bridge to Apple MusicKit: personal-account login (the Apple ID on
//  the device), user playlists, and in-app playback via ApplicationMusicPlayer.
//
//  Requirements (docs/APPLE_MUSIC_SETUP.md):
//   - "MusicKit" app service enabled for the bundle id in the Apple
//     Developer portal (tokens are then handled automatically by the OS -
//     no manual developer token needed for the MusicKit framework).
//   - NSAppleMusicUsageDescription in Info.plist.
//   - Library requests need iOS 16+; older versions get a clear error.
//

import Foundation
import MusicKit

@objc(MusicKitModule)
class MusicKitModule: NSObject {

  @objc static func requiresMainQueueSetup() -> Bool { false }

  // MARK: - Authorization (the user's personal Apple Music account)

  @objc func requestAuthorization(_ resolve: @escaping RCTPromiseResolveBlock,
                                  rejecter reject: @escaping RCTPromiseRejectBlock) {
    Task {
      let status = await MusicAuthorization.request()
      resolve(status == .authorized)
    }
  }

  @objc func isAuthorized(_ resolve: @escaping RCTPromiseResolveBlock,
                          rejecter reject: @escaping RCTPromiseRejectBlock) {
    resolve(MusicAuthorization.currentStatus == .authorized)
  }

  @objc func isSubscribed(_ resolve: @escaping RCTPromiseResolveBlock,
                          rejecter reject: @escaping RCTPromiseRejectBlock) {
    Task {
      do {
        let subscription = try await MusicSubscription.current
        resolve(subscription.canPlayCatalogContent)
      } catch {
        resolve(false)
      }
    }
  }

  // MARK: - Library playlists

  @objc func getUserPlaylists(_ resolve: @escaping RCTPromiseResolveBlock,
                              rejecter reject: @escaping RCTPromiseRejectBlock) {
    guard #available(iOS 16.0, *) else {
      reject("ios_version", "Apple Music library access requires iOS 16 or newer", nil)
      return
    }
    Task {
      do {
        var request = MusicLibraryRequest<Playlist>()
        request.limit = 50
        let response = try await request.response()
        let items: [[String: Any]] = response.items.map { playlist in
          var item: [String: Any] = [
            "id": playlist.id.rawValue,
            "name": playlist.name,
          ]
          if let url = playlist.artwork?.url(width: 300, height: 300) {
            item["artworkUrl"] = url.absoluteString
          }
          return item
        }
        resolve(items)
      } catch {
        reject("playlists_failed", error.localizedDescription, error)
      }
    }
  }

  // MARK: - Playback (in-app, via ApplicationMusicPlayer)

  @objc func playPlaylist(_ playlistId: String,
                          resolver resolve: @escaping RCTPromiseResolveBlock,
                          rejecter reject: @escaping RCTPromiseRejectBlock) {
    guard #available(iOS 16.0, *) else {
      reject("ios_version", "Apple Music playback requires iOS 16 or newer", nil)
      return
    }
    Task {
      do {
        var request = MusicLibraryRequest<Playlist>()
        request.filter(matching: \.id, equalTo: MusicItemID(playlistId))
        let response = try await request.response()
        guard let playlist = response.items.first else {
          reject("not_found", "Playlist not found in the user's library", nil)
          return
        }
        let detailed = try await playlist.with(.tracks)
        let player = ApplicationMusicPlayer.shared
        player.queue = ApplicationMusicPlayer.Queue(for: [detailed])
        player.state.repeatMode = .all // the alarm must not go silent
        try await player.play()
        resolve(Self.nowPlayingInfo(from: detailed.tracks?.first))
      } catch {
        reject("play_failed", error.localizedDescription, error)
      }
    }
  }

  @objc func playLibraryShuffle(_ resolve: @escaping RCTPromiseResolveBlock,
                                rejecter reject: @escaping RCTPromiseRejectBlock) {
    guard #available(iOS 16.0, *) else {
      reject("ios_version", "Apple Music playback requires iOS 16 or newer", nil)
      return
    }
    Task {
      do {
        var request = MusicLibraryRequest<Song>()
        request.limit = 100
        let response = try await request.response()
        let songs = response.items.shuffled()
        guard !songs.isEmpty else {
          reject("empty_library", "No songs in the user's Apple Music library", nil)
          return
        }
        let player = ApplicationMusicPlayer.shared
        player.queue = ApplicationMusicPlayer.Queue(for: songs)
        player.state.repeatMode = .all
        try await player.play()
        resolve(Self.nowPlayingInfo(from: songs.first))
      } catch {
        reject("play_failed", error.localizedDescription, error)
      }
    }
  }

  @objc func stop(_ resolve: @escaping RCTPromiseResolveBlock,
                  rejecter reject: @escaping RCTPromiseRejectBlock) {
    ApplicationMusicPlayer.shared.stop()
    resolve(true)
  }

  // MARK: - Helpers

  @available(iOS 16.0, *)
  private static func nowPlayingInfo(from track: Track?) -> [String: Any]? {
    guard let track = track else { return nil }
    var info: [String: Any] = [
      "title": track.title,
      "artist": track.artistName,
    ]
    if let url = track.artwork?.url(width: 300, height: 300) {
      info["artworkUrl"] = url.absoluteString
    }
    if let duration = track.duration {
      info["durationMs"] = duration * 1000
    }
    return info
  }

  @available(iOS 16.0, *)
  private static func nowPlayingInfo(from song: Song?) -> [String: Any]? {
    guard let song = song else { return nil }
    var info: [String: Any] = [
      "title": song.title,
      "artist": song.artistName,
    ]
    if let url = song.artwork?.url(width: 300, height: 300) {
      info["artworkUrl"] = url.absoluteString
    }
    if let duration = song.duration {
      info["durationMs"] = duration * 1000
    }
    return info
  }
}
