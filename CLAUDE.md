# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## プロジェクト概要

3D LUT（Lookup Table）のCubeファイルをCanvasに適用するTypeScriptプロジェクトです。Vite + TypeScriptで構築されたWebアプリケーションで、現在はCubeファイルパーサーが実装済みです。

## 開発コマンド

### 基本的な開発フロー

- `npm run dev` - 開発サーバー起動
- `npm run build` - 本番ビルド
- `npm run preview` - ビルド結果のプレビュー

### コード品質チェック

- `npm run checkall` - すべてのチェックを一括実行（format、lint、type）
- `npm run format:check` - Prettierフォーマットチェック
- `npm run lint:check` - ESLintによるリンティング
- `npm run type:check` - TypeScriptの型チェック
- `npm run fix` - 自動修正（format、lint、type）

## アーキテクチャ

### メイン構造

- **src/main.ts**: アプリケーションのエントリーポイント、Canvas描画とCubeファイル読み込みの統合
- **src/lib/parseCube.ts**: 3D LUT Cubeファイルの完全なパーサー実装
- **src/lib/canvas.ts**: Canvas APIを使った画像描画機能
- **src/lib/interporate.ts**: 線形・バイリニア・トリリニア補完アルゴリズム
- **public/lut.cube**: テスト用のサンプル3D LUTファイル
- **public/img.avif**: テスト用のサンプル画像ファイル

### 重要な設計パターン

- **モジュール分離**: `lib/`フォルダでユーティリティ関数を分離
- **厳密な型チェック**: TypeScript設定で安全性を重視
- **パスエイリアス**: `baseUrl: "./src"`でインポートパスを簡潔化
- **ES Modules**: モダンなモジュールシステムを使用

### Cubeファイルパーサーの仕様

`parseCube.ts`は以下の機能を提供：

- TITLE、LUT_3D_SIZE、DOMAIN_MIN/MAX、LUTデータポイントの解析
- 厳密なバリデーションとエラーハンドリング
- RGB値の配列として3D LUTデータを格納
- 完全なCubeフォーマット準拠

### 開発時の注意点

- ESLintで厳格なコード品質ルールを適用
- JSDocコメントが必須
- import順序の規則が厳格
- Prettierとの連携でコードフォーマットを統一

### 実装済み機能

- **Cubeファイルパーサー**: 完全なCubeフォーマット解析とバリデーション
- **Canvas描画**: 画像の非同期読み込みとCanvas描画
- **補完アルゴリズム**: 線形、バイリニア、トリリニア補完の実装

### 今後の実装予定領域

- 3D LUT適用のピクセル変換アルゴリズム
- WebGL/WebGPUを使った高速処理
- ユーザーインターフェース（ファイルアップロード、プレビュー等）
