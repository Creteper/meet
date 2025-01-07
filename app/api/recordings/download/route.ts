import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { url } = await request.json();
    
    if (!url) {
      return NextResponse.json({ error: '无效的URL' }, { status: 400 });
    }

    // 通过后端获取文件
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`下载失败: ${response.status}`);
    }

    const blob = await response.blob();
    const fileName = url.split('/').pop() || 'recording.mp4';

    // 返回文件流
    return new NextResponse(blob, {
      headers: {
        'Content-Type': 'video/mp4',
        'Content-Disposition': `attachment; filename="${fileName}"`,
      },
    });

  } catch (error) {
    console.error('下载失败:', error);
    return NextResponse.json(
      { error: '下载失败' },
      { status: 500 }
    );
  }
}