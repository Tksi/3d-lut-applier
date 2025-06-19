# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## プロジェクト概要

3D LUT（Look-Up Table）をCanvasに適用するWebアプリケーション。Cubeファイル形式の3D LUTを使用して画像のカラーグレーディングを行い、処理前後の画像を比較表示する。

## 開発コマンド

### 基本開発コマンド

- `npm run dev` - 開発サーバー起動
- `npm run build` - TypeScript＋Viteビルド
- `npm run preview` - Wranglerでプレビュー（本番環境相当）
- `npm run deploy` - ビルド＋Cloudflare Pagesデプロイ

### コード品質チェック・フォーマット

- `npm run format:check` - Prettierフォーマットチェック
- `npm run lint:check` - ESLintチェック（キャッシュ有効）
- `npm run type:check` - TypeScriptタイプチェック
- `npm run checkall` - 全チェック実行
- `npm run fix` - フォーマット修正＋リント修正＋タイプチェック

## アーキテクチャ

### 処理の流れ

1. **画像読み込み**: ドラッグ＆ドロップまたはファイル選択で画像を読み込み
2. **LUT読み込み**: 起動時に`/lut.cube`ファイルをフェッチしてパース
3. **Worker処理**: Web Workerでバックグラウンドで3D LUT適用
4. **Canvas描画**: 元画像と処理後画像をCanvasに描画
5. **比較表示**: マウス/タッチでスライダー表示による比較

### 主要モジュール構成

- `main.ts` - メインアプリケーション、UI操作、ワーカー管理
- `lib/parseCube.ts` - Cubeファイルパーサー
- `lib/applyLut.ts` - 3D LUT適用ロジック（トリリニア補間）
- `lib/interporate.ts` - 3D補間計算
- `lib/canvas.ts` - Canvas描画ユーティリティ
- `lib/WorkerPool.ts` - Web Worker プール管理（並列処理制御）
- `workers/lutWorker.ts` - Web Worker（重い処理を別スレッド実行）
- `workers/lutChunkWorker.ts` - チャンク単位の並列LUT処理Worker

### 技術特徴

- **Web Worker Pool**: 並列チャンク処理でパフォーマンス最適化
- **タッチ対応**: モバイルデバイス対応
- **Canvas比較UI**: スライダーでリアルタイム比較
- **3D補間**: トリリニア補間による高品質な色変換
- **Cloudflare Pages**: 本番環境はCloudflare Pagesを使用

### 設定・ツール

- TypeScript設定: `tsconfig.json`
- Vite設定: パス解決、ES2024ターゲット
- ESLint設定: 厳格なTypeScript/Unicornルール、import順序
- Prettier設定: gitignoreベース
- Wrangler設定: Cloudflare Pages向け設定

## 開発時の注意

- リント・タイプエラーが発生した場合は `npm run checkall` で確認
- コードは JSDocコメント必須（publicな関数・クラス）
- import順序・型定義はESLintルールに従う
- Web Workerのメッセージ型は厳密に定義済み
