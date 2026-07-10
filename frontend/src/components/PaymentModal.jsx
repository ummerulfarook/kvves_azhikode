import { useEffect } from 'react'
import { Modal, Form, InputNumber, Select, DatePicker, Input, Button } from 'antd'
import { PAYMENT_MODE_OPTIONS } from '../utils/constants'
import { formatCurrency } from '../utils/formatters'
import dayjs from 'dayjs'

const { Option } = Select

const PaymentModal = ({
  open,
  onClose,
  onSubmit,
  loading,
  title = 'Record Payment',
  amount,
  monthNumber,
}) => {
  const [form] = Form.useForm()

  useEffect(() => {
    if (open) {
      form.setFieldsValue({
        amount_paid: amount,
        payment_mode: 'cash',
        paid_date: dayjs(),
        receipt_no: '',
        late_fee: 0,
        remarks: '',
      })
    }
  }, [open, amount, form])

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields()
      await onSubmit({
        ...values,
        paid_date: values.paid_date ? values.paid_date.format('YYYY-MM-DD') : dayjs().format('YYYY-MM-DD'),
        is_paid: true,
      })
      form.resetFields()
      onClose()
    } catch (_) {}
  }

  return (
    <Modal
      title={title}
      open={open}
      onCancel={onClose}
      footer={[
        <Button key="cancel" onClick={onClose}>Cancel</Button>,
        <Button key="submit" type="primary" loading={loading} onClick={handleSubmit}>
          Record Payment
        </Button>,
      ]}
      width={480}
    >
      {monthNumber && (
        <p style={{ color: '#9ba3bc', marginBottom: 16 }}>
          Month #{monthNumber} — Due: {formatCurrency(amount)}
        </p>
      )}
      <Form form={form} layout="vertical" initialValues={{ payment_mode: 'cash', paid_date: dayjs() }}>
        <Form.Item label="Amount Paid" name="amount_paid" rules={[{ required: true, message: 'Amount is required.' }]}
          initialValue={amount}>
          <InputNumber
            style={{ width: '100%' }}
            min={0}
            prefix="₹"
            formatter={(v) => v?.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
          />
        </Form.Item>
        <Form.Item label="Payment Mode" name="payment_mode" rules={[{ required: true }]}>
          <Select>
            {PAYMENT_MODE_OPTIONS.map((o) => (
              <Option key={o.value} value={o.value}>{o.label}</Option>
            ))}
          </Select>
        </Form.Item>
        <Form.Item label="Paid Date" name="paid_date" rules={[{ required: true, message: 'Date is required.' }]}>
          <DatePicker style={{ width: '100%' }} format="DD/MM/YYYY" />
        </Form.Item>
        <Form.Item label="Receipt No" name="receipt_no">
          <Input placeholder="Optional receipt number" />
        </Form.Item>
        <Form.Item label="Late Fee (₹)" name="late_fee" initialValue={0}>
          <InputNumber style={{ width: '100%' }} min={0} prefix="₹" />
        </Form.Item>
        <Form.Item label="Remarks" name="remarks">
          <Input.TextArea rows={2} placeholder="Optional remarks" />
        </Form.Item>
      </Form>
    </Modal>
  )
}

export default PaymentModal
