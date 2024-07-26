import React from 'react';
import {Form, Input} from 'antd';
import {debounce} from 'lodash';
import {history} from '../../../hooks/useHistory';
import ELNode from '../../../model/node';
import styles from './index.module.less';

interface IProps {
  model: ELNode;
}

const ComponentPropertiesEditor: React.FC<IProps> = (props) => {
  const {model} = props;
  const properties = model.getProperties();

  const [form] = Form.useForm();
  form.setFieldsValue({
    id: model.id,
    tag: model.properties?.tag,
    req: model.properties?.req
  });

  const handleOnChange = debounce(async () => {
    try {
      const changedValues = await form.validateFields();
      model.id = changedValues.id ? changedValues.id : model.id;
      changedValues.id = null;
      model.setProperties({...properties, ...changedValues});

      // history.push(undefined, {silent: true});
      history.push();
    } catch (errorInfo) {
      console.log('Failed:', errorInfo);
    }
  }, 200);

  return (
    <div className={styles.liteflowEditorPropertiesEditorContainer}>
      <Form
        layout="vertical"
        form={form}
        initialValues={{...properties}}
        // onValuesChange={handleOnChange}
        onBlur={handleOnChange}
      >
        <Form.Item name="id" label="ID">
          <Input allowClear/>
        </Form.Item>
        <Form.Item name="req" label="参数（data）">
          <Input allowClear/>
        </Form.Item>
        <Form.Item name="tag" label="标签（tag）">
          <Input allowClear/>
        </Form.Item>
      </Form>
    </div>
  );
};

export default ComponentPropertiesEditor;
