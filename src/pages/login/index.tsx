import React, { Fragment, useEffect, useState } from 'react';
import {
  Button,
  Row,
  Input,
  Form,
  message,
  notification,
  Statistic,
} from 'antd';
import config from '@/utils/config';
import { history, useOutletContext } from '@umijs/max';
import styles from './index.less';
import { request } from '@/utils/http';
import { useTheme } from '@/utils/hooks';
import { MobileOutlined } from '@ant-design/icons';
import { SharedContext } from '@/layouts';

const FormItem = Form.Item;
const { Countdown } = Statistic;

const Login = () => {
  const { reloadUser } = useOutletContext<SharedContext>();
  const [loading, setLoading] = useState(false);
  const [waitTime, setWaitTime] = useState<any>();
  const { theme } = useTheme();
  const [twoFactor, setTwoFactor] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [loginInfo, setLoginInfo] = useState<any>();

  const handleOk = (values: any) => {
    setLoading(true);
    setTwoFactor(false);
    setWaitTime(null);
    request
      .post(`${config.apiPrefix}user/login`, {
        data: {
          username: values.username,
          password: values.password,
        },
      })
      .then((data) => {
        checkResponse(data, values);
        setLoading(false);
      })
      .catch(function (error) {
        console.log(error);
        setLoading(false);
      });
  };

  const completeTowFactor = (values: any) => {
    setVerifying(true);
    request
      .put(`${config.apiPrefix}user/two-factor/login`, {
        data: { ...loginInfo, code: values.code },
      })
      .then((data: any) => {
        checkResponse(data);
        setVerifying(false);
      })
      .catch((error: any) => {
        console.log(error);
        setVerifying(false);
      });
  };

  const checkResponse = (
    { code, data, message: _message }: any,
    values?: any,
  ) => {
    if (code === 200) {
      const {
        token,
        lastip,
        lastaddr,
        lastlogon,
        retries = 0,
        platform,
      } = data;
      localStorage.setItem(config.authKey, token);
      notification.success({
        message: '???????????????',
        description: (
          <>
            <div>
              ?????????????????????
              {lastlogon ? new Date(lastlogon).toLocaleString() : '-'}
            </div>
            <div>?????????????????????{lastaddr || '-'}</div>
            <div>????????????IP???{lastip || '-'}</div>
            <div>?????????????????????{platform || '-'}</div>
            <div>?????????????????????{retries > 0 ? `??????${retries}???` : '??????'}</div>
          </>
        ),
      });
      reloadUser(true);
      history.push('/crontab');
    } else if (code === 410) {
      setWaitTime(data);
    } else if (code === 420) {
      setLoginInfo({
        username: values.username,
        password: values.password,
      });
      setTwoFactor(true);
    }
  };

  const codeInputChange = (e: React.ChangeEvent) => {
    const { value } = e.target as any;
    const regx = /^[0-9]{6}$/;
    if (regx.test(value)) {
      completeTowFactor({ code: value });
    }
  };

  useEffect(() => {
    const isAuth = localStorage.getItem(config.authKey);
    if (isAuth) {
      history.push('/crontab');
    }
  }, []);

  return (
    <div className={styles.container}>
      <div className={styles.top}>
        <div className={styles.header}>
          <img
            alt="logo"
            className={styles.logo}
            src="https://qn.whyour.cn/logo.png"
          />
          <span className={styles.title}>
            {twoFactor ? '????????????' : config.siteName}
          </span>
        </div>
      </div>
      <div className={styles.main}>
        {twoFactor ? (
          <Form layout="vertical" onFinish={completeTowFactor}>
            <FormItem
              name="code"
              label="?????????"
              rules={[
                {
                  pattern: /^[0-9]{6}$/,
                  message: '????????????6?????????',
                },
              ]}
              validateTrigger="onBlur"
            >
              <Input
                placeholder="6?????????"
                onChange={codeInputChange}
                autoFocus
                autoComplete="off"
              />
            </FormItem>
            <Button
              type="primary"
              htmlType="submit"
              style={{ width: '100%' }}
              loading={verifying}
            >
              ??????
            </Button>
          </Form>
        ) : (
          <Form layout="vertical" onFinish={handleOk}>
            <FormItem name="username" label="?????????" hasFeedback>
              <Input placeholder="?????????" autoFocus />
            </FormItem>
            <FormItem name="password" label="??????" hasFeedback>
              <Input type="password" placeholder="??????" />
            </FormItem>
            <Row>
              {waitTime ? (
                <Button type="primary" style={{ width: '100%' }} disabled>
                  ???
                  <Countdown
                    valueStyle={{
                      color:
                        theme === 'vs'
                          ? 'rgba(0,0,0,.25)'
                          : 'rgba(232, 230, 227, 0.25)',
                    }}
                    className="inline-countdown"
                    onFinish={() => setWaitTime(null)}
                    format="ss"
                    value={Date.now() + 1000 * waitTime}
                  />
                  ????????????
                </Button>
              ) : (
                <Button
                  type="primary"
                  htmlType="submit"
                  style={{ width: '100%' }}
                  loading={loading}
                >
                  ??????
                </Button>
              )}
            </Row>
          </Form>
        )}
      </div>
      <div className={styles.extra}>
        {twoFactor ? (
          <div style={{ paddingLeft: 20, position: 'relative' }}>
            <MobileOutlined style={{ position: 'absolute', left: 0, top: 4 }} />
            ?????????????????????????????????????????????????????????????????????????????????????????????????????????
          </div>
        ) : (
          ''
        )}
      </div>
    </div>
  );
};

export default Login;
