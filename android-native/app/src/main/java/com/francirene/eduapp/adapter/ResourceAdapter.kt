package com.francirene.eduapp.adapter

import android.view.LayoutInflater
import android.view.ViewGroup
import androidx.recyclerview.widget.RecyclerView
import com.francirene.eduapp.databinding.ItemResourceBinding
import com.francirene.eduapp.model.Resource

class ResourceAdapter(
    private var items: List<Resource>,
    private val showDelete: Boolean = false,
    private val onDelete: ((Resource) -> Unit)? = null,
    private val onClick: ((Resource) -> Unit)? = null
) : RecyclerView.Adapter<ResourceAdapter.VH>() {

    inner class VH(val binding: ItemResourceBinding) : RecyclerView.ViewHolder(binding.root)

    override fun onCreateViewHolder(parent: ViewGroup, viewType: Int): VH {
        val binding = ItemResourceBinding.inflate(LayoutInflater.from(parent.context), parent, false)
        return VH(binding)
    }

    override fun getItemCount() = items.size

    override fun onBindViewHolder(holder: VH, position: Int) {
        val r = items[position]
        holder.binding.tvTitle.text = r.title
        holder.binding.tvSubject.text = r.subject
        holder.binding.tvDescription.text = r.description ?: ""

        if (showDelete) {
            holder.binding.btnDelete.visibility = android.view.View.VISIBLE
            holder.binding.btnDelete.setOnClickListener { onDelete?.invoke(r) }
        }
        holder.binding.root.setOnClickListener { onClick?.invoke(r) }
    }

    fun update(newItems: List<Resource>) {
        items = newItems
        notifyDataSetChanged()
    }
}
