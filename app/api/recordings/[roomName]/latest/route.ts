import { S3Client, ListObjectsV2Command } from "@aws-sdk/client-s3";
import { NextRequest, NextResponse } from 'next/server';

export async function GET(
  request: NextRequest,
  { params }: { params: { roomName: string } }
) {
  const s3Client = new S3Client({
    region: process.env.S3_REGION!,
    endpoint: process.env.S3_ENDPOINT,
    credentials: {
      accessKeyId: process.env.S3_KEY_ID!,
      secretAccessKey: process.env.S3_KEY_SECRET!,
    },
  });

  try {
    // 列出所有以房间名结尾的文件
    const command = new ListObjectsV2Command({
      Bucket: process.env.S3_BUCKET!,
      // 不使用前缀，因为时间戳在前面
      // 我们会在后面过滤包含房间名的文件
    });
    
    const response = await s3Client.send(command);
    
    if (!response.Contents || response.Contents.length === 0) {
      return NextResponse.json(
        { error: '未找到录制文件' },
        { status: 404 }
      );
    }

    // 过滤并排序文件
    const roomFiles = response.Contents
      .filter(file => file.Key?.includes(`-${params.roomName}.mp4`))
      .sort((a, b) => {
        // 按最后修改时间降序排序
        return (b.LastModified?.getTime() || 0) - (a.LastModified?.getTime() || 0);
      });

    if (roomFiles.length === 0) {
      return NextResponse.json(
        { error: '未找到该房间的录制文件' },
        { status: 404 }
      );
    }

    // 获取最新的文件
    const latestFile = roomFiles[0];
    
    // 构建完整的 S3 URL
    const fileUrl = `https://${process.env.S3_BUCKET}.s3.${process.env.S3_REGION}.amazonaws.com/${latestFile.Key}`;

    return NextResponse.json({ 
      url: fileUrl,
      fileName: latestFile.Key,
      lastModified: latestFile.LastModified,
      size: latestFile.Size
    });
    
  } catch (error) {
    console.error('获取录制文件失败:', error);
    return NextResponse.json(
      { error: '获取录制文件失败' },
      { status: 500 }
    );
  }
}