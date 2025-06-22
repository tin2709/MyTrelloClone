// src/app/signup/page.tsx

'use client'; // Đánh dấu đây là Client Component để sử dụng Form của AntD

import React from 'react';
import { Button, Card, Divider, Form, Input, Typography, Space, Flex } from 'antd';
import { FcGoogle } from 'react-icons/fc';
import { FaMicrosoft, FaApple, FaSlack } from 'react-icons/fa';

const { Title, Text, Link } = Typography;

interface SignUpFormValues {
    email: string;
    username: string;
    password: string;
}

export default function SignUpPage() {
    const [form] = Form.useForm();

    // Hàm này sẽ được gọi khi form được submit và đã qua validation
    const onFinish = (values: SignUpFormValues) => {
        console.log('Received values of form: ', values);
        alert('Đăng ký thành công! Kiểm tra console để xem dữ liệu.');
    };


    const SocialButton = ({ icon, text }: { icon: React.ReactNode; text: string }) => (
        <Button size="large" block icon={icon}>
            {text}
        </Button>
    );

    return (
        <Flex align="center" justify="center" style={{ minHeight: '100vh', background: '#f0f2f5' }}>
            <Card style={{ width: 400, textAlign: 'center' }}>
                <Space direction="vertical" size="middle" style={{ display: 'flex' }}>

                    <Title level={2} style={{ margin: 0 }}>Trello</Title>
                    <Text style={{ fontSize: '16px', color: '#5E6C84' }}>Đăng ký để tiếp tục</Text>

                    <Form
                        form={form}
                        name="register"
                        onFinish={onFinish}
                        layout="vertical"
                        requiredMark={false}
                    >
                        <Form.Item
                            name="email"
                            rules={[
                                { type: 'email', message: 'Email không hợp lệ!' },
                                { required: true, message: 'Vui lòng nhập Email!' },
                            ]}
                        >
                            <Input size="large" placeholder="Nhập email của bạn" />
                        </Form.Item>

                        <Form.Item
                            name="username"
                            rules={[{ required: true, message: 'Vui lòng nhập tên người dùng!' }]}
                        >
                            <Input size="large" placeholder="Nhập tên người dùng" />
                        </Form.Item>

                        <Form.Item
                            name="password"
                            rules={[{ required: true, message: 'Vui lòng nhập mật khẩu!' }]}
                        >
                            <Input.Password size="large" placeholder="Nhập mật khẩu" />
                        </Form.Item>

                        <Text style={{ fontSize: 12, color: 'gray' }}>
                            Bằng việc đăng ký, tôi chấp nhận <Link href="#">Điều khoản dịch vụ</Link> và <Link href="#">Chính sách quyền riêng tư</Link>.
                        </Text>

                        <Form.Item style={{marginTop: '1rem'}}>
                            <Button type="primary" htmlType="submit" size="large" block>
                                Đăng ký
                            </Button>
                        </Form.Item>
                    </Form>

                    <Divider>Hoặc tiếp tục với:</Divider>

                    <Flex vertical gap="small">
                        <SocialButton icon={<FcGoogle />} text="Google" />
                        <SocialButton icon={<FaMicrosoft color="#00A4EF" />} text="Microsoft" />
                        <SocialButton icon={<FaApple />} text="Apple" />
                        <SocialButton icon={<FaSlack />} text="Slack" />
                    </Flex>

                    <Divider />

                    <Link href="#">Bạn đã có tài khoản? Đăng nhập</Link>
                </Space>
            </Card>
        </Flex>
    );
}